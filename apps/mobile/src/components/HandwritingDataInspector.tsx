import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import type { HandwritingAttempt } from '@baya/shared-types';
import { AttemptDetailView } from './AttemptDetailView';

interface Props {
  attempt: HandwritingAttempt;
  onClose: () => void;
  onDelete: () => void | Promise<void>;
}

/** Saved-attempt detail. Review uses the same AttemptDetailView content. */
export function HandwritingDataInspector({ attempt, onClose, onDelete }: Props) {
  const [showRawJson, setShowRawJson] = useState(false);
  const { width, height } = useWindowDimensions();
  const previewSize = Math.max(140, Math.min(260, width * 0.26, height - 210));

  const confirmDelete = () => {
    Alert.alert(
      `Delete saved ${attempt.targetClass.toUpperCase()}?`,
      `This removes Attempt ${attempt.attemptNumber ?? '—'} from the active collection.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void onDelete() },
      ],
    );
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>SAVED ATTEMPT</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <AttemptDetailView
              attempt={attempt}
              imageUri={attempt.imageUri}
              previewLabel="Persisted handwriting"
              previewSize={previewSize}
            />

            <TouchableOpacity
              style={styles.rawDataBtn}
              onPress={() => setShowRawJson(current => !current)}
            >
              <Text style={styles.rawDataBtnText}>
                {showRawJson ? 'Hide Stroke Data' : 'View Stroke Data'}
              </Text>
            </TouchableOpacity>

            {showRawJson && (
              <View style={styles.jsonBox}>
                <Text style={styles.jsonText}>{JSON.stringify(attempt.strokes, null, 2)}</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 460,
    height: '92%',
    maxHeight: 620,
    backgroundColor: '#FFF',
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    color: '#333',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  closeBtn: {
    backgroundColor: '#F2F2F2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeBtnText: {
    color: '#555',
    fontSize: 12,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 18,
  },
  rawDataBtn: {
    alignSelf: 'center',
    marginTop: 16,
    backgroundColor: '#EEE',
    borderRadius: 7,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  rawDataBtnText: {
    color: '#444',
    fontSize: 12,
    fontWeight: '700',
  },
  jsonBox: {
    marginTop: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 10,
  },
  jsonText: {
    color: '#444',
    fontFamily: 'monospace',
    fontSize: 9,
  },
  actions: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  deleteBtn: {
    backgroundColor: '#EF5350',
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
