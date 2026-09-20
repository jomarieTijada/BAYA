import {
  ATTEMPTS_PER_CHARACTER,
  BAYBAYIN_CLASSES,
  getCollectionProgress,
  type BaybayinClass,
  type CollectionAttemptIdsByClass,
  type HandwritingAttempt,
  type RecordedStroke,
} from '@baya/shared-types';

export const DATA_GATHERING_HEADER = {
  title: 'DATA GATHERING',
} as const;

export interface ResponsiveInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function calculateResponsiveUI(
  width: number,
  height: number,
  insets: ResponsiveInsets,
  pixelRatio: number,
) {
  const isCompact = width < 850 || height < 500;
  const outerPadding = isCompact ? 8 : 16;
  const panelGap = isCompact ? 8 : 16;
  const cardPadding = isCompact ? 10 : 16;
  const leftFlex = 1;
  const rightFlex = 1;
  const centerFlex = isCompact ? 2.5 : 2;
  const titleFont = isCompact ? 16 : 18;
  const bodyFont = isCompact ? 11 : 13;
  const btnFont = isCompact ? 12 : 13;
  const iconSize = isCompact ? 32 : 44;
  const toolbarButtonSize = isCompact ? 34 : 40;
  const historyThumb = isCompact ? 40 : 52;
  const totalFlex = leftFlex + centerFlex + rightFlex;
  const safeWidth = width - insets.left - insets.right;
  const centerWidth =
    (safeWidth - (2 * outerPadding) - (2 * panelGap)) * (centerFlex / totalFlex);
  const safeHeight = height - insets.top - insets.bottom;
  const compactHeaderHeight = iconSize + (isCompact ? 8 : 12);
  const availableCenterHeight = safeHeight - compactHeaderHeight - (2 * outerPadding);
  const availableCanvasWidth = centerWidth - (cardPadding * 2) - 4;
  const centerCardHeaderHeight = toolbarButtonSize + (isCompact ? 8 : 12);
  const availableCanvasHeight =
    availableCenterHeight - (cardPadding * 2) - centerCardHeaderHeight - 4;
  const canvasSize = Math.max(
    150,
    Math.min(availableCanvasWidth, availableCanvasHeight, 450),
  );

  return {
    outerPadding,
    panelGap,
    cardPadding,
    leftFlex,
    centerFlex,
    rightFlex,
    canvasSize,
    titleFont,
    bodyFont,
    btnFont,
    iconSize,
    toolbarButtonSize,
    historyThumb,
    isCompact,
    insets,
    screenWidth: width,
    screenHeight: height,
    pixelRatio,
    layoutMode: height < 390 ? 'compact' : height < 550 ? 'phone' : 'tablet',
  };
}

export interface CharacterProgressView {
  completedCharacterCount: number;
  targetCharacterCount: number;
  ratio: number;
  label: string;
}

export function buildCharacterProgressView(
  attemptIdsByClass: CollectionAttemptIdsByClass,
  targets: readonly BaybayinClass[] = BAYBAYIN_CLASSES,
): CharacterProgressView {
  const progress = getCollectionProgress(attemptIdsByClass, targets);
  return {
    completedCharacterCount: progress.completedCharacterCount,
    targetCharacterCount: progress.targetCharacterCount,
    ratio: progress.targetCharacterCount === 0
      ? 0
      : progress.completedCharacterCount / progress.targetCharacterCount,
    label: `${progress.completedCharacterCount} / ${progress.targetCharacterCount} complete`,
  };
}

export interface HistoryCharacterGroup {
  targetClass: BaybayinClass;
  savedCount: number;
  attempts: HandwritingAttempt[];
}

/** Build top-level History rows strictly from persisted active-session IDs. */
export function buildGroupedHistory(
  attempts: readonly HandwritingAttempt[],
  attemptIdsByClass: CollectionAttemptIdsByClass,
  targets: readonly BaybayinClass[] = BAYBAYIN_CLASSES,
): HistoryCharacterGroup[] {
  const attemptsById = new Map(attempts.map(attempt => [attempt.attemptId, attempt]));

  return targets.map(targetClass => {
    const acceptedIds = attemptIdsByClass[targetClass] ?? [];
    const groupedAttempts = acceptedIds
      .map(attemptId => attemptsById.get(attemptId))
      .filter((attempt): attempt is HandwritingAttempt =>
        attempt != null && attempt.targetClass === targetClass,
      );

    return {
      targetClass,
      savedCount: Math.min(groupedAttempts.length, ATTEMPTS_PER_CHARACTER),
      attempts: groupedAttempts,
    };
  });
}

export function findHistoryAttemptById(
  groups: readonly HistoryCharacterGroup[],
  attemptId: string,
): HandwritingAttempt | null {
  for (const group of groups) {
    const match = group.attempts.find(attempt => attempt.attemptId === attemptId);
    if (match) return match;
  }
  return null;
}

export interface AttemptDetailData {
  attemptId: string;
  attemptNumber: number | null;
  targetClass: BaybayinClass;
  canvasWidth: number;
  canvasHeight: number;
  screenWidth?: number;
  screenHeight?: number;
  pixelRatio?: number;
  layoutMode?: string;
  durationMs: number;
  strokes: RecordedStroke[];
  schemaVersion?: number;
}

export function getAttemptDetailMetrics(attempt: AttemptDetailData) {
  return {
    strokeCount: attempt.strokes.length,
    pointCount: attempt.strokes.reduce(
      (total, stroke) => total + stroke.points.length,
      0,
    ),
    durationSeconds: attempt.durationMs / 1000,
  };
}

export interface ExclusiveOperationGate {
  running: boolean;
}

export type ExportUiState = 'idle' | 'exporting' | 'success' | 'error';

/** Acquire a synchronous single-flight lock; the caller must release it. */
export function beginExclusiveOperation(
  gate: ExclusiveOperationGate,
): (() => void) | null {
  if (gate.running) return null;
  gate.running = true;
  return () => {
    gate.running = false;
  };
}

/** Run at most one asynchronous operation and always release the gate. */
export async function runExclusiveOperation(
  gate: ExclusiveOperationGate,
  operation: () => Promise<void>,
): Promise<boolean> {
  const release = beginExclusiveOperation(gate);
  if (!release) return false;

  try {
    await operation();
    return true;
  } finally {
    release();
  }
}
