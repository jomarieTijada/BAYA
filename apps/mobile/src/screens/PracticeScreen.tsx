/**
 * apps/mobile/src/screens/PracticeScreen.tsx
 *
 * Main practice screen for the BAYA handwriting data-collection pipeline.
 *
 * Responsibilities:
 *   - Iterates through all configured BAYBAYIN_CLASSES in order
 *   - Owns the DrawingCanvas ref (imperative handle)
 *   - Owns the useStrokeRecorder hook (attempt-level telemetry)
 *   - Owns the useHandwritingDb hook (SQLite + migrations)
 *   - Implements Submit Attempt with atomic image + DB persistence
 *   - Shows persisted attempts grouped by character in the left column
 *   - Shows completion after every target has five persisted attempts
 */

import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWindowDimensions } from "react-native";
import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  FlatList,
  PermissionsAndroid,
  Platform,
  Modal,
  Alert,
  PixelRatio,
  AppState,
} from 'react-native';
import * as Crypto from 'expo-crypto';
import { File, Paths } from 'expo-file-system';
import DrawingCanvas, { type DrawingCanvasHandle } from '../../components/DrawingCanvas';
import { AttemptDetailView } from '../components/AttemptDetailView';
import { HandwritingDataInspector } from '../components/HandwritingDataInspector';
import { useStrokeRecorder } from '../recorder/useStrokeRecorder';
import { validateRecordedStrokes } from '../recorder/strokeRecorderLogic';
import { useHandwritingDb } from '../hooks/useHandwritingDb';
import {
  loadLatestHandwritingAttempt,
  commitRetakeHandwritingAttempt,
  commitDeleteHandwritingAttempt
} from '../services/handwritingStorage';
import { exportDataset } from '../services/datasetExport';
import {
  BAYBAYIN_CLASSES,
  ATTEMPTS_PER_CHARACTER,
  getAcceptedAttemptCount,
  getCollectionProgress,
  getNextIncompleteTarget,
  type BaybayinClass,
  type CollectionAttemptIdsByClass,
  type HandwritingAttempt,
  type NewHandwritingAttemptDraft,
} from '@baya/shared-types';
import {
  DATA_GATHERING_HEADER,
  buildCharacterProgressView,
  buildGroupedHistory,
  calculateResponsiveUI,
  findHistoryAttemptById,
  runExclusiveOperation,
  type ExportUiState,
} from './practiceUiLogic';



// ---------------------------------------------------------------------------
// Responsive UI System
// ---------------------------------------------------------------------------
export function useResponsiveUI() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return calculateResponsiveUI(width, height, insets, PixelRatio.get());
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HistoryItem {
  attempt: HandwritingAttempt;
  attemptNumber: number;
}

interface PendingAttemptData {
  draft: Omit<NewHandwritingAttemptDraft, 'imageUri'>;
  imageBytes: Uint8Array;
  tempImageUri: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PracticeScreen() {
  const ui = useResponsiveUI();
  const styles = React.useMemo(() => createStyles(ui), [ui]);

  const canvasRef = useRef<DrawingCanvasHandle | null>(null);
  const recorder  = useStrokeRecorder();
  const { db, isReady, error: dbError } = useHandwritingDb();

  // Collection session state
  const [sessionAttemptIdsByClass, setSessionAttemptIdsByClass] = useState<CollectionAttemptIdsByClass>({});
  const [retakeContext, setRetakeContext] = useState<{
    targetClass: BaybayinClass;
    oldAttemptId: string;
    attemptNumber: number;
  } | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]); // newest first
  const [expandedTarget, setExpandedTarget] = useState<BaybayinClass | null>(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showGuide, setShowGuide]       = useState(true);

  // Export state
  const [exportState, setExportState] = useState<ExportUiState>('idle');
  const exportGateRef = useRef({ running: false });
  const isExporting = exportState === 'exporting';

  // Debug inspector (Load Last only)
  const [loadedAttempt, setLoadedAttempt] = useState<HandwritingAttempt | null>(null);
  
  const [pendingAttempt, setPendingAttempt] = useState<PendingAttemptData | null>(null);
  const [persistedPendingAttempt, setPersistedPendingAttempt] = useState<HandwritingAttempt | null>(null);
  const persistedPendingAttemptRef = useRef<HandwritingAttempt | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);

  // Derived state
  const collectionProgress = getCollectionProgress(sessionAttemptIdsByClass);
  const currentTarget: BaybayinClass | null = retakeContext
    ? retakeContext.targetClass
    : getNextIncompleteTarget(sessionAttemptIdsByClass);

  const currentAcceptedCount = currentTarget == null
    ? 0
    : getAcceptedAttemptCount(sessionAttemptIdsByClass, currentTarget);
  const currentAttemptNumber = retakeContext?.attemptNumber ?? (
    currentTarget == null
      ? null
      : Math.min(currentAcceptedCount + 1, ATTEMPTS_PER_CHARACTER)
  );
  const characterProgressView = buildCharacterProgressView(sessionAttemptIdsByClass);
  const historyGroups = React.useMemo(
    () => buildGroupedHistory(
      historyItems.map(item => item.attempt),
      sessionAttemptIdsByClass,
    ),
    [historyItems, sessionAttemptIdsByClass],
  );

  const loadSession = useCallback(async () => {
    if (!isReady) return;
    try {
      const {
        getCollectionSessionAttempts,
        getCollectionSessionState,
      } = require('../../../../packages/db/src/handwritingRepository');
      const sessionState = await getCollectionSessionState(db);
      
      if (sessionState && sessionState.attemptIdsByClass) {
        const attemptsByClass = sessionState.attemptIdsByClass;
        setSessionAttemptIdsByClass(attemptsByClass);

        const sessionAttempts: HandwritingAttempt[] = await getCollectionSessionAttempts(db, sessionState);
        const newHistory: HistoryItem[] = sessionAttempts.map(attempt => ({
          attempt,
          attemptNumber: attempt.attemptNumber ?? 1,
        }));
        // newest at top
        newHistory.sort((a, b) => b.attempt.createdAt - a.attempt.createdAt);
        setHistoryItems(newHistory);
      } else {
        setSessionAttemptIdsByClass({});
        setHistoryItems([]);
      }
    } catch (err) {
      console.error('[PracticeScreen] Session resume failed:', err);
    }
  }, [isReady, db]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active' && !savingRef.current) {
        void loadSession();
      }
    });
    return () => subscription.remove();
  }, [loadSession]);

  React.useEffect(() => {
    async function requestStoragePermission() {
      if (Platform.OS === 'android') {
        try {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'BAYA File Storage Permission',
              message: 'BAYA needs access to your storage to save data backups to your tablet.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
        } catch (err) {
          console.warn('[PracticeScreen] Storage permission error:', err);
        }
      }
    }
    requestStoragePermission();
  }, []);

  const handleSubmit = useCallback(async () => {
    console.log("[BAYA Submit]", { isComplete: currentTarget === null, isSubmitting, isReady, hasPending: !!pendingAttempt, targetClass: currentTarget });
    
    if (!isReady) {
      Alert.alert('Not Ready', 'Database is initializing. Please wait.');
      return;
    }
    if (currentTarget === null) {
      Alert.alert('Complete', 'Collection is complete.');
      return;
    }
    if (submittingRef.current || isSubmitting) {
      Alert.alert('Busy', 'Already preparing review...');
      return;
    }
    if (pendingAttempt) {
      Alert.alert('Busy', 'Review is already open.');
      return;
    }
    if (currentAttemptNumber == null) {
      Alert.alert('Complete', 'Collection is complete.');
      return;
    }

    const finalSnapshot = recorder.getSnapshot();
    const hasVisualInk = canvasRef.current?.hasInk() ?? false;

    if (finalSnapshot.isCancelled) {
      Alert.alert('Cancelled', 'Gesture was interrupted. Clear and try again.');
      return;
    }

    if (finalSnapshot.isActive) {
      Alert.alert('Drawing in progress', 'Lift your finger before submitting.');
      return;
    }

    if (finalSnapshot.strokes.length === 0) {
      if (hasVisualInk) {
        console.error('[BAYA DATA INVARIANT VIOLATION]', {
          visualInk: true,
          completedStrokes: 0,
          activeStroke: false,
          targetClass: currentTarget
        });
        Alert.alert(
          'Desynchronized', 
          'Drawing data was interrupted. Please clear and redraw this character.',
          [
            { text: 'Clear & Retry', style: 'destructive', onPress: () => { canvasRef.current?.clear(); recorder.reset(); } }
          ]
        );
        return;
      } else {
        Alert.alert('Empty', 'Please write the character first.');
        return;
      }
    }

    const currentCanvas = canvasRef.current?.getDimensions() ?? null;
    if (
      currentCanvas === null ||
      finalSnapshot.canvasWidth === null ||
      finalSnapshot.canvasHeight === null
    ) {
      Alert.alert('Canvas unavailable', 'Clear and redraw this character.');
      return;
    }

    const canvasChanged =
      Math.abs(currentCanvas.width - finalSnapshot.canvasWidth) > 0.01 ||
      Math.abs(currentCanvas.height - finalSnapshot.canvasHeight) > 0.01;
    if (canvasChanged) {
      console.error('[BAYA DATA INVARIANT VIOLATION] Canvas resized during attempt', {
        recorded: {
          width: finalSnapshot.canvasWidth,
          height: finalSnapshot.canvasHeight,
        },
        current: currentCanvas,
      });
      Alert.alert(
        'Canvas size changed',
        'The screen changed size while drawing. Clear and redraw this character.',
      );
      return;
    }

    const traceErrors = validateRecordedStrokes(
      finalSnapshot.strokes,
      finalSnapshot.canvasWidth,
      finalSnapshot.canvasHeight,
    );
    if (traceErrors.length > 0) {
      console.error('[BAYA DATA INVARIANT VIOLATION] Invalid raw trace', traceErrors);
      Alert.alert('Invalid drawing data', 'Clear and redraw this character.');
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setStatusMessage('Preparing review…');

    try {
      const attemptId = Crypto.randomUUID();
      
      // --- DEVELOPMENT TEMPORAL INVARIANT CHECKS ---
      if (__DEV__ && finalSnapshot.strokes.length > 0) {
        const strokes = finalSnapshot.strokes;
        const firstStroke = strokes[0];
        const lastStroke = strokes[strokes.length - 1];
        
        if (firstStroke.startedAtMs > 2) {
          console.warn(`[BAYA Time Origin] firstStroke.startedAtMs is ${firstStroke.startedAtMs}, expected ~0`);
        }
        if (firstStroke.points.length > 0 && firstStroke.points[0].t > 2) {
          console.warn(`[BAYA Time Origin] firstStroke.points[0].t is ${firstStroke.points[0].t}, expected ~0`);
        }
        if (Math.abs(finalSnapshot.durationMs - lastStroke.endedAtMs) > 2) {
          console.warn(`[BAYA Time Origin] durationMs is ${finalSnapshot.durationMs}, expected ${lastStroke.endedAtMs}`);
        }
        
        for (let i = 0; i < strokes.length; i++) {
          const s = strokes[i];
          if (s.startedAtMs < 0 || s.endedAtMs < s.startedAtMs) {
            console.warn(`[BAYA Time Origin] invalid stroke boundaries on strokeId ${s.strokeId}`);
          }
          if (i > 0 && s.startedAtMs < strokes[i-1].endedAtMs) {
            console.warn(`[BAYA Time Origin] stroke ${s.strokeId} starts before previous stroke ends`);
          }
          let lastT = -1;
          for (const p of s.points) {
            if (p.t < lastT) {
              console.warn(`[BAYA Time Origin] non-monotonic time inside stroke ${s.strokeId}: ${lastT} -> ${p.t}`);
            }
            lastT = p.t;
          }
        }
      }
      // ---------------------------------------------

      const imageBytes = await canvasRef.current?.captureImage() ?? null;
      if (!imageBytes) throw new Error('Failed to capture PNG');

      const tempFile = new File(Paths.cache, `pending_${attemptId}.png`);
      await tempFile.write(imageBytes); // ADD AWAIT HERE TO PREVENT ASYNC LEAK

      // Freeze strokes data deeply
      const frozenStrokes = JSON.parse(JSON.stringify(finalSnapshot.strokes));

      const draft = {
        attemptId,
        attemptNumber: currentAttemptNumber,
        participantId: null,
        activityId: null,
        targetClass: currentTarget,
        canvasWidth: finalSnapshot.canvasWidth,
        canvasHeight: finalSnapshot.canvasHeight,
        screenWidth: ui.screenWidth,
        screenHeight: ui.screenHeight,
        pixelRatio: ui.pixelRatio,
        layoutMode: ui.layoutMode,
        durationMs: finalSnapshot.durationMs,
        strokes: frozenStrokes,
        createdAt: Date.now(),
      };

      setPendingAttempt({ draft, imageBytes, tempImageUri: tempFile.uri });
      setStatusMessage(''); // Clear status to not distract
    } catch (err) {
      console.error('[PracticeScreen] Prepare review failed:', err);
      setStatusMessage('Failed to prepare review — see console.');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [currentAttemptNumber, currentTarget, isSubmitting, isReady, pendingAttempt, recorder, ui]);

  const handleReviewRetry = useCallback(() => {
    if (!pendingAttempt) return;
    try {
      const tempFile = new File(pendingAttempt.tempImageUri);
      if (tempFile.exists) tempFile.delete();
    } catch (e) {}

    setPendingAttempt(null);
    canvasRef.current?.clear();
    recorder.reset();
  }, [pendingAttempt, recorder]);

  const handleReviewDone = useCallback(async () => {
    console.log("[BAYA Done]", { hasPending: !!pendingAttempt, isReady, savingRef: savingRef.current, isSaving });

    if (!pendingAttempt) {
      Alert.alert('Error', 'No pending attempt to save.');
      return;
    }
    if (!isReady) {
      Alert.alert('Not Ready', 'Database not ready.');
      return;
    }
    if (savingRef.current || isSaving) {
      Alert.alert('Busy', 'Currently saving...');
      return;
    }
    
    savingRef.current = true;
    setIsSaving(true);
    setStatusMessage('Saving…');
    canvasRef.current?.clear();
    recorder.reset();

    try {
      // 1. Atomic Commit (Filesystem + SQLite Transaction)
      let savedAttempt = persistedPendingAttemptRef.current;
      if (!savedAttempt) {
        if (retakeContext) {
          const { commitRetakeHandwritingAttempt } = require('../services/handwritingStorage');
          savedAttempt = await commitRetakeHandwritingAttempt(db, retakeContext.oldAttemptId, pendingAttempt.draft, pendingAttempt.imageBytes);
        } else {
          const { commitReviewedHandwritingAttempt } = require('../services/handwritingStorage');
          savedAttempt = await commitReviewedHandwritingAttempt(db, pendingAttempt.draft, pendingAttempt.imageBytes);
        }
        persistedPendingAttemptRef.current = savedAttempt;
        setPersistedPendingAttempt(savedAttempt);
      }
      if (!savedAttempt) throw new Error('Save completed without returning the persisted attempt.');

      // 2. Fetch the newly committed session state for UI updates
      await loadSession();

      // 3. Clean up temp file
      try {
        const tempFile = new File(pendingAttempt.tempImageUri);
        if (tempFile.exists) tempFile.delete();
      } catch (e) {}

      // Cleanup...
      setStatusMessage(`✓ Attempt ${savedAttempt.attemptNumber ?? pendingAttempt.draft.attemptNumber} saved`);
      setPendingAttempt(null);
      persistedPendingAttemptRef.current = null;
      setPersistedPendingAttempt(null);
      setRetakeContext(null); // Clear retake mode
    } catch (err) {
      console.error('[PracticeScreen] Save failed:', err);
      // Determine if we partially succeeded (e.g. UI state out of sync)
      if (persistedPendingAttemptRef.current) {
        setStatusMessage('Sample saved, but progress update failed. Retry.');
      } else {
        setStatusMessage('Save failed — see console.');
      }
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }, [pendingAttempt, isReady, isSaving, db, recorder, retakeContext, loadSession]);

  const handleRetake = useCallback((targetCls: BaybayinClass, oldId: string, attemptNumber: number) => {
    if (isSaving || pendingAttempt) return;
    setRetakeContext({ targetClass: targetCls, oldAttemptId: oldId, attemptNumber });
    setStatusMessage(`Retaking ${targetCls}, attempt ${attemptNumber}...`);
    canvasRef.current?.clear();
    recorder.reset();
  }, [isSaving, pendingAttempt, recorder]);

  const handleDelete = useCallback((targetCls: BaybayinClass, attemptId: string, imageUri: string | null) => {
    if (isSaving || pendingAttempt) return;
    Alert.alert(
      `Delete saved ${targetCls}?`,
      `This will remove this saved handwriting sample. ${targetCls} will need to be collected again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSaving(true);
              const { commitDeleteHandwritingAttempt } = require('../services/handwritingStorage');
              await commitDeleteHandwritingAttempt(db, targetCls, attemptId, imageUri);
              await loadSession();
              // If we deleted the active retake target, abort retake mode
              if (retakeContext?.targetClass === targetCls) setRetakeContext(null);
            } catch (e) {
              console.error('Delete failed', e);
              setStatusMessage('Delete failed.');
            } finally {
              setIsSaving(false);
            }
          }
        }
      ]
    );
  }, [isSaving, pendingAttempt, db, loadSession, retakeContext]);

  const handleUndo = useCallback(() => {
    recorder.undo();
    canvasRef.current?.redraw(recorder.getSnapshot().strokes);
  }, [recorder]);

  const handleLoadLast = useCallback(async () => {
    if (!isReady) return;
    try {
      const attempt = await loadLatestHandwritingAttempt(db);
      if (attempt == null) {
        setStatusMessage('No saved attempts yet.');
      } else {
        setLoadedAttempt(attempt);
        setStatusMessage(`Loaded: ${attempt.attemptId.slice(0, 8)}\u2026`);
      }
    } catch (err) {
      console.error('[PracticeScreen] Load failed:', err);
      setStatusMessage('Load failed \u2014 see console.');
    }
  }, [isReady, db]);

  const handleOpenHistoryAttempt = useCallback((attemptId: string) => {
    const selectedAttempt = findHistoryAttemptById(historyGroups, attemptId);
    if (selectedAttempt) setLoadedAttempt(selectedAttempt);
  }, [historyGroups]);

  const handleExport = useCallback(async () => {
    if (exportGateRef.current.running) return;
    setExportState('exporting');
    try {
      const started = await runExclusiveOperation(
        exportGateRef.current,
        () => exportDataset(db),
      );
      if (started) setExportState('success');
    } catch (err) {
      console.error('[PracticeScreen] Export failed:', err);
      setExportState('error');
    }
  }, [db]);

  const handleResetSession = useCallback(() => {
    Alert.alert(
      'Start New Session?',
      'This will reset progress so the next person can collect their data. All saved samples are kept — nothing is deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset for Next Person',
          style: 'destructive',
          onPress: async () => {
            try {
              const { resetCollectionSession } = require('../../../../packages/db/src/handwritingRepository');
              await resetCollectionSession(db);
              // Reset all local UI state
              setSessionAttemptIdsByClass({});
              setHistoryItems([]);
              setRetakeContext(null);
              setExpandedTarget(null);
              setStatusMessage('');
              setExportState('idle');
              canvasRef.current?.clear();
              recorder.reset();
            } catch (err) {
              console.error('[PracticeScreen] Session reset failed:', err);
              Alert.alert('Reset Failed', 'Could not reset the session. See console for details.');
            }
          },
        },
      ],
    );
  }, [db, recorder]);

  if (dbError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Database error: {dbError.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* ── TOP ROW ── */}
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.iconText}>{'\u2190'}</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitleMain}>{DATA_GATHERING_HEADER.title}</Text>
        </View>

        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.iconText}>{'\u2699'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── MAIN CONTENT ROW ── */}
      <View style={styles.mainContent}>
        {/* LEFT COLUMN — GROUPED HISTORY + PINNED EXPORT */}
        <View style={styles.leftColumn}>
          <Text style={styles.historyTitle}>HISTORY</Text>
          <FlatList
            data={historyGroups}
            keyExtractor={group => group.targetClass}
            style={styles.historyScroll}
            contentContainerStyle={styles.historyContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: group }) => {
              const isExpanded = expandedTarget === group.targetClass;
              const isCurrent = currentTarget === group.targetClass;
              return (
                <View style={[
                  styles.historyGroup,
                  isCurrent && styles.historyGroupCurrent,
                ]}>
                  <TouchableOpacity
                    style={styles.historyGroupHeader}
                    onPress={() => setExpandedTarget(isExpanded ? null : group.targetClass)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.historyGroupHeadingRow}>
                      <Text style={styles.historyGroupLabel}>{group.targetClass.toUpperCase()}</Text>
                      <View style={styles.historyGroupCountRow}>
                        {isCurrent && <Text style={styles.currentLabel}>Current</Text>}
                        <Text style={styles.historyGroupCount}>
                          {`${group.savedCount}/${ATTEMPTS_PER_CHARACTER}`}
                        </Text>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={14}
                          color="#777"
                        />
                      </View>
                    </View>
                    <View style={styles.attemptDotsRow}>
                      {Array.from({ length: ATTEMPTS_PER_CHARACTER }, (_, index) => (
                        <View
                          key={index}
                          style={[
                            styles.attemptDot,
                            index < group.savedCount && styles.attemptDotSaved,
                          ]}
                        />
                      ))}
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.historyAttempts}>
                      {group.attempts.length === 0 ? (
                        <Text style={styles.historyGroupEmpty}>No saved attempts.</Text>
                      ) : group.attempts.map(attempt => (
                        <View key={attempt.attemptId} style={styles.historyAttemptItem}>
                          <TouchableOpacity
                            style={styles.historyAttemptMain}
                            onPress={() => handleOpenHistoryAttempt(attempt.attemptId)}
                            activeOpacity={0.7}
                          >
                            {attempt.imageUri ? (
                              <Image
                                source={{ uri: attempt.imageUri }}
                                style={styles.historyThumb}
                                resizeMode="contain"
                              />
                            ) : (
                              <View style={[styles.historyThumb, styles.historyThumbEmpty]} />
                            )}
                            <View style={styles.historyMeta}>
                              <Text style={styles.historyAttemptLabel}>
                                {`Attempt ${attempt.attemptNumber ?? '—'}/${ATTEMPTS_PER_CHARACTER}`}
                              </Text>
                              <Text style={styles.historyStatus}>{'\u2713 Saved'}</Text>
                            </View>
                          </TouchableOpacity>
                          <View style={styles.historyAttemptActions}>
                            <TouchableOpacity
                              onPress={() => handleRetake(
                                attempt.targetClass,
                                attempt.attemptId,
                                attempt.attemptNumber ?? 1,
                              )}
                              style={styles.retakeButton}
                              disabled={isSaving}
                            >
                              <Text style={styles.retakeButtonText}>Retake</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleDelete(
                                attempt.targetClass,
                                attempt.attemptId,
                                attempt.imageUri,
                              )}
                              style={styles.deleteButton}
                              disabled={isSaving}
                            >
                              <Text style={styles.deleteButtonText}>Delete</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            }}
          />

          <View style={styles.historyFooter}>
            <TouchableOpacity
              style={[
                styles.historyExportBtn,
                (isExporting || isSaving || !!pendingAttempt || historyItems.length === 0) && styles.exportBtnDisabled,
              ]}
              onPress={handleExport}
              disabled={isExporting || isSaving || !!pendingAttempt || historyItems.length === 0}
              activeOpacity={0.8}
            >
              {isExporting ? (
                <View style={styles.exportingRow}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.historyExportBtnText}>Exporting...</Text>
                </View>
              ) : (
                <Text style={styles.historyExportBtnText}>Export Data</Text>
              )}
            </TouchableOpacity>
            {exportState === 'success' && (
              <Text style={styles.exportStatus}>Export complete. Local data preserved.</Text>
            )}
            {exportState === 'error' && (
              <Text style={styles.exportStatus}>Export failed. Try again.</Text>
            )}
          </View>
        </View>

        {/* CENTER COLUMN — EXISTING CANVAS AND CONTROLS */}
        <View style={styles.centerColumn}>
          {currentTarget === null ? (
            <View style={[styles.card, styles.completeContainer]}>
              <Text style={styles.completeTitle}>Collection Complete 🎉</Text>
              <Text style={styles.completeSubtitle}>
                {`${collectionProgress.completedCharacterCount} / ${collectionProgress.targetCharacterCount} characters finished`}
              </Text>
              <TouchableOpacity
                style={styles.resetSessionButton}
                onPress={handleResetSession}
                activeOpacity={0.8}
              >
                <Text style={styles.resetSessionButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={[styles.card, styles.practiceCard]}>
                <View style={styles.practiceHeader}>
                  <View style={styles.toolbarRow}>
                    <TouchableOpacity style={styles.toolbarIconBtn} onPress={handleUndo}>
                      <Ionicons name="arrow-undo" size={ui.toolbarButtonSize * 0.55} color="#555" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toolbarIconBtn} onPress={() => { canvasRef.current?.clear(); recorder.reset(); }}>
                      <Ionicons name="trash-outline" size={ui.toolbarButtonSize * 0.6} color="#E53935" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.canvasContainer}>
                  <DrawingCanvas
                    ref={canvasRef}
                    width={ui.canvasSize}
                    height={ui.canvasSize}
                    showGuide={showGuide}
                    targetClass={currentTarget}
                    onGestureBegin={recorder.onTouchBegin}
                    onGestureMove={recorder.onTouchMove}
                    onGestureEnd={recorder.onTouchEnd}
                    onGestureCancel={recorder.onTouchCancel}
                    onClear={recorder.reset}
                  />
                </View>
              </View>

              {/* Existing debug row */}
              <View style={styles.debugActionsRow}>
                <TouchableOpacity
                  style={[styles.debugBtn, !isReady && styles.debugBtnDisabled]}
                  onPress={handleLoadLast}
                  disabled={!isReady}
                >
                  <Text style={styles.debugBtnText}>Load Last (Debug)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.debugBtn}
                  onPress={() => { canvasRef.current?.clear(); recorder.reset(); }}
                >
                  <Text style={styles.debugBtnText}>Clear All</Text>
                </TouchableOpacity>
                {statusMessage !== '' && <Text style={styles.statusText}>{statusMessage}</Text>}
                {!isReady && !dbError && <Text style={styles.dbStatus}>{'Init DB\u2026'}</Text>}
              </View>
            </>
          )}
        </View>

        {/* RIGHT COLUMN — CURRENT CHARACTER PROGRESS + SUBMIT */}
        <View style={styles.rightColumn}>
          <View style={[styles.card, styles.rightInfoCard]}>
            <Text style={styles.progressSectionTitle}>CHARACTER PROGRESS</Text>
            <Text style={styles.characterProgressCount}>{characterProgressView.label}</Text>
            <View style={styles.characterProgressTrack}>
              <View
                style={[
                  styles.characterProgressFill,
                  { width: `${Math.min(100, characterProgressView.ratio * 100)}%` },
                ]}
              />
            </View>

            <View style={styles.rightDivider} />
            <Text style={styles.progressSectionTitle}>TARGET</Text>
            <Text style={styles.currentTargetText}>
              {currentTarget?.toUpperCase() ?? '—'}
            </Text>
            <Text style={styles.currentAttemptText}>
              {currentAttemptNumber == null
                ? 'All attempts saved'
                : `Attempt ${currentAttemptNumber} of ${ATTEMPTS_PER_CHARACTER}`}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!isReady || isSubmitting || currentTarget === null || pendingAttempt != null) && styles.submitDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!isReady || isSubmitting || currentTarget === null || pendingAttempt != null}
            activeOpacity={0.8}
          >
            {isSubmitting
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.submitButtonText}>{'Submit \u203a'}</Text>
            }
          </TouchableOpacity>
        </View>

      </View>{/* end mainContent */}

      {/* ── REVIEW OVERLAY ── */}
      {pendingAttempt != null && (
        <HandwritingAttemptReview
          ui={ui}
          styles={styles}
          draft={pendingAttempt.draft}
          tempImageUri={pendingAttempt.tempImageUri}
          isSaving={isSaving}
          isPartiallyPersisted={persistedPendingAttempt != null}
          onRetry={handleReviewRetry}
          onDone={handleReviewDone}
        />
      )}

      {/* ── DEBUG INSPECTOR (Load Last only) ── */}
      {loadedAttempt != null && (
        <HandwritingDataInspector
          attempt={loadedAttempt}
          onClose={() => setLoadedAttempt(null)}
          onDelete={async () => {
            try {
              await commitDeleteHandwritingAttempt(
                db,
                loadedAttempt.targetClass,
                loadedAttempt.attemptId,
                loadedAttempt.imageUri,
              );
              await loadSession();
            } catch (err) {
              console.error('[PracticeScreen] Delete failed:', err);
            }
            setLoadedAttempt(null);
          }}
        />
      )}

    </View>
  );
}

function HandwritingAttemptReview({ draft, tempImageUri, isSaving, isPartiallyPersisted, onRetry, onDone, ui, styles }: any) {
  const previewSize = Math.max(
    140,
    Math.min(ui.isCompact ? 180 : 260, ui.screenHeight - 210),
  );

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={() => {
        // Intentionally blocked to prevent accidental data loss from the Android Back gesture.
        // The Review must be resolved explicitly via the visible Retry or Done buttons.
      }}
    >
      <View style={styles.reviewOverlay}>
        <View style={styles.reviewContainer}>
          <Text style={styles.reviewTitle}>REVIEW ATTEMPT</Text>

          <ScrollView style={styles.reviewScroll} contentContainerStyle={styles.reviewScrollContent}>
            <AttemptDetailView
              attempt={draft}
              imageUri={tempImageUri}
              previewLabel="Current unsaved candidate"
              previewSize={previewSize}
            />
          </ScrollView>

          <View style={styles.reviewActions}>
            <TouchableOpacity style={[styles.reviewBtn, styles.reviewRetryBtn, isPartiallyPersisted && styles.reviewBtnDisabled]} onPress={onRetry} disabled={isSaving || isPartiallyPersisted}>
              <Text style={styles.reviewRetryBtnText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.reviewBtn, styles.reviewDoneBtn, isSaving && styles.reviewBtnDisabled]} onPress={onDone} disabled={isSaving}>
              <Text style={styles.reviewDoneBtnText}>{isSaving ? 'Saving...' : (isPartiallyPersisted ? 'Retry Save' : 'Done')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const BG = '#FAF5E5';
const CARD_BG = '#FFFFFF';
const GREEN = '#3E8027';
const ORANGE = '#EE8D21';

function createStyles(ui: ReturnType<typeof useResponsiveUI>) {
  return StyleSheet.create({
    container: { flex: 1, width: '100%', backgroundColor: BG, padding: ui.outerPadding },

    // Top row
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: ui.isCompact ? 8 : 12 },
    iconButton: { width: ui.iconSize, height: ui.iconSize, backgroundColor: '#FFF', borderRadius: ui.iconSize / 2, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
    iconText: { fontSize: ui.isCompact ? 16 : 20, color: ORANGE, fontWeight: 'bold' },
    headerTitleContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    headerTitleMain: { fontSize: ui.titleFont, fontWeight: 'bold', color: '#333', letterSpacing: 1, textAlign: 'center' },

    // Main layout
    mainContent: { flex: 1, flexDirection: 'row', gap: ui.panelGap },
    leftColumn: { flex: ui.leftFlex, minWidth: 0, gap: ui.isCompact ? 6 : 10 },
    centerColumn: { flex: ui.centerFlex, minWidth: 0, alignItems: 'center' },
    rightColumn: { flex: ui.rightFlex, minWidth: 0, gap: ui.panelGap },

    // Cards
    card: { backgroundColor: CARD_BG, borderRadius: 16, padding: ui.cardPadding, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4 },

    // Left column — grouped History
    historyTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', letterSpacing: 1, textAlign: 'center' },
    historyScroll: { flex: 1 },
    historyContent: { gap: 7, paddingBottom: 6 },
    historyGroup: { backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: '#EEE', overflow: 'hidden' },
    historyGroupCurrent: { borderColor: '#9AC78A', backgroundColor: '#FBFEFA' },
    historyGroupHeader: { padding: ui.isCompact ? 7 : 9 },
    historyGroupHeadingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 6 },
    historyGroupLabel: { fontSize: ui.isCompact ? 13 : 15, fontWeight: 'bold', color: '#333' },
    historyGroupCountRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    historyGroupCount: { fontSize: ui.bodyFont, color: '#555', fontWeight: '700' },
    currentLabel: { fontSize: 9, color: GREEN, fontWeight: '700' },
    attemptDotsRow: { flexDirection: 'row', gap: 5, marginTop: 6 },
    attemptDot: { width: ui.isCompact ? 8 : 9, height: ui.isCompact ? 8 : 9, borderRadius: 5, borderWidth: 1, borderColor: '#BDBDBD', backgroundColor: '#FFF' },
    attemptDotSaved: { borderColor: GREEN, backgroundColor: GREEN },
    historyAttempts: { borderTopWidth: 1, borderTopColor: '#EEE', padding: 7, gap: 7 },
    historyGroupEmpty: { color: '#999', fontSize: 10, fontStyle: 'italic', paddingVertical: 3 },
    historyAttemptItem: { backgroundColor: '#FAFAFA', borderRadius: 8, padding: 6, borderWidth: 1, borderColor: '#EEE' },
    historyAttemptMain: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    historyThumb: { width: ui.historyThumb, height: ui.historyThumb, borderRadius: 6, backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#DDD' },
    historyThumbEmpty: { backgroundColor: '#EEE' },
    historyMeta: { flex: 1 },
    historyAttemptLabel: { fontSize: ui.isCompact ? 11 : 13, fontWeight: 'bold', color: '#333' },
    historyStatus: { fontSize: 10, color: '#4CAF50', fontWeight: '600' },
    historyAttemptActions: { flexDirection: 'row', gap: 6, marginTop: 6 },
    retakeButton: { paddingVertical: 5, backgroundColor: '#FFCA28', borderRadius: 5, flex: 1, alignItems: 'center' },
    retakeButtonText: { fontSize: 10, fontWeight: 'bold', color: '#4E342E' },
    deleteButton: { paddingVertical: 5, backgroundColor: '#EF5350', borderRadius: 5, flex: 1, alignItems: 'center' },
    deleteButtonText: { fontSize: 10, fontWeight: 'bold', color: '#FFF' },
    historyFooter: { width: '100%' },
    historyExportBtn: { width: '100%', minHeight: ui.isCompact ? 38 : 44, backgroundColor: '#4CAF50', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    historyExportBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: ui.btnFont },
    exportingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    exportBtnDisabled: { opacity: 0.5 },
    exportStatus: { minHeight: ui.isCompact ? 24 : 30, fontSize: ui.isCompact ? 9 : 11, lineHeight: ui.isCompact ? 11 : 14, color: '#666', marginTop: 5, textAlign: 'center' },

    // Center column
    practiceCard: { width: '100%', padding: ui.cardPadding, alignItems: 'center' },
    practiceHeader: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', width: '100%', marginBottom: ui.isCompact ? 8 : 12 },
    toolbarRow: { flexDirection: 'row', gap: 12 },
    toolbarIconBtn: { width: ui.toolbarButtonSize, height: ui.toolbarButtonSize, borderRadius: ui.toolbarButtonSize / 2, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
    canvasContainer: { backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: '#F0F0F0', borderStyle: 'dashed' },

    // Right column — persisted character progress and current target
    rightInfoCard: { flex: 1, width: '100%' },
    progressSectionTitle: { fontSize: ui.bodyFont, fontWeight: 'bold', color: '#555', letterSpacing: 0.8, textAlign: 'center' },
    characterProgressCount: { fontSize: ui.isCompact ? 13 : 16, color: '#333', fontWeight: 'bold', textAlign: 'center', marginTop: ui.isCompact ? 8 : 12 },
    characterProgressTrack: { width: '100%', height: ui.isCompact ? 7 : 9, borderRadius: 6, backgroundColor: '#E4E4E4', overflow: 'hidden', marginTop: 9 },
    characterProgressFill: { height: '100%', borderRadius: 6, backgroundColor: GREEN },
    rightDivider: { height: 1, backgroundColor: '#EEE', marginVertical: ui.isCompact ? 14 : 22 },
    currentTargetText: { color: '#A88000', fontSize: ui.isCompact ? 34 : 46, lineHeight: ui.isCompact ? 40 : 52, fontWeight: 'bold', textAlign: 'center', marginTop: ui.isCompact ? 5 : 10 },
    currentAttemptText: { color: GREEN, fontSize: ui.isCompact ? 12 : 15, fontWeight: '700', textAlign: 'center', marginTop: 7 },

    // Debug
    debugActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' },
    debugBtn: { backgroundColor: '#EBE5D5', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6 },
    debugBtnText: { fontSize: 11, color: '#666' },
    debugBtnDisabled: { opacity: 0.5 },
    statusText: { fontSize: 12, color: '#666' },
    dbStatus: { fontSize: 12, color: '#999', fontStyle: 'italic' },

    // Shared review modal shell
    reviewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    reviewContainer: { backgroundColor: '#FFF', borderRadius: 20, width: '100%', maxWidth: 460, height: '92%', maxHeight: 620, overflow: 'hidden' },
    reviewScroll: { flex: 1 },
    reviewScrollContent: { padding: ui.isCompact ? 16 : 20 },
    reviewTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: '#333', paddingTop: 16 },
    reviewActions: { flexDirection: 'row', gap: 12, padding: ui.isCompact ? 14 : 18, borderTopWidth: 1, borderTopColor: '#EEE', backgroundColor: '#FAFAFA' },
    reviewBtn: { flex: 1, paddingVertical: ui.isCompact ? 10 : 14, borderRadius: 12, alignItems: 'center' },
    reviewRetryBtn: { backgroundColor: '#FFF', borderWidth: 2, borderColor: '#FF5252' },
    reviewRetryBtnText: { color: '#FF5252', fontWeight: 'bold', fontSize: 15 },
    reviewDoneBtn: { backgroundColor: GREEN },
    reviewDoneBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
    reviewBtnDisabled: { opacity: 0.5 },

    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: 'red', fontSize: 16 },
    completeContainer: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', padding: 20 },
    completeTitle: { fontSize: 24, fontWeight: 'bold', color: '#4CAF50', marginBottom: 10 },
    completeSubtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 24 },
    resetSessionButton: { marginTop: 8, backgroundColor: ORANGE, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 10, alignItems: 'center' },
    resetSessionButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    submitButton: { width: '100%', backgroundColor: GREEN, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    submitDisabled: { opacity: 0.5 },
    submitButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  });

}
