/**
 * packages/shared-types/src/index.ts
 *
 * Domain types inferred from the Drizzle schema.
 * Import these in both the mobile app and any future server-side code.
 * Never define types here that duplicate Drizzle InferSelectModel — import
 * those directly from @baya/db instead. Use this package for non-DB types.
 */

// ---------------------------------------------------------------------------
// Activity types (mirrors lessonActivities.activityType column values)
// ---------------------------------------------------------------------------
export type ActivityType = "practice" | "quiz" | "recognition";

// ---------------------------------------------------------------------------
// Stroke telemetry — the raw data captured from the Skia canvas
// ---------------------------------------------------------------------------
export interface StrokePoint {
  x: number;       // raw canvas-local logical-pixel X coordinate
  y: number;       // raw canvas-local logical-pixel Y coordinate
  t: number;       // Unix timestamp in ms (Date.now())
  pressure?: number; // optional — stylus only
}

export type Stroke = StrokePoint[];
export type StrokeSession = Stroke[];

// ---------------------------------------------------------------------------
// ML inference result — returned by the inference service to the UI layer
// ---------------------------------------------------------------------------
export interface InferenceResult {
  visualAccuracy:   number;   // 0.0 – 1.0
  sequenceAccuracy: number;   // 0.0 – 1.0
  kudlitAccuracy:   0 | 1 | null;
  errorCategory:    string;
  inferenceTimeMs:  number;
  xpAwarded:        number;
}

// ---------------------------------------------------------------------------
// Assistant mood literals
// ---------------------------------------------------------------------------
export type AssistantMood = "happy" | "encouraging" | "neutral" | "concerned";

// ===========================================================================
// HANDWRITING DATASET TYPES  (Slice 2 — data-collection pipeline)
// ===========================================================================

// ---------------------------------------------------------------------------
// Canonical Baybayin class label set
//
// Single source of truth for the 63 canonical class IDs used throughout the
// BAYA system. The ML model's class_indices.json MUST match this list
// (validated separately; not imported at runtime).
//
// Ordering matches class_indices.json for human readability but the
// BaybayinClass union type is what matters for type-safety.
// ---------------------------------------------------------------------------
export const BAYBAYIN_CLASSES = [
  'a',
  'b',    'ba',    'be_bi',  'bo_bu',
  'd',    'da_ra', 'de_di',  'do_du',
  'e_i',
  'g',    'ga',    'ge_gi',  'go_gu',
  'h',    'ha',    'he_hi',  'ho_hu',
  'k',    'ka',    'ke_ki',  'ko_ku',
  'l',    'la',    'le_li',  'lo_lu',
  'm',    'ma',    'me_mi',  'mo_mu',
  'n',    'na',    'ne_ni',
  'ng',   'nga',   'nge_ngi','ngo_ngu','no_nu',
  'o_u',
  'p',    'pa',    'pe_pi',  'po_pu',
  'r',    'ra',    're_ri',  'ro_ru',
  's',    'sa',    'se_si',  'so_su',
  't',    'ta',    'te_ti',  'to_tu',
  'w',    'wa',    'we_wi',  'wo_wu',
  'y',    'ya',    'ye_yi',  'yo_yu',
] as const;

/** Union of all 63 canonical Baybayin class label strings. */
export type BaybayinClass = typeof BAYBAYIN_CLASSES[number];

/** Number of independently accepted samples required for every target class. */
export const ATTEMPTS_PER_CHARACTER = 5 as const;

/** Schema version written by newly collected handwriting attempts and exports. */
export const HANDWRITING_SCHEMA_VERSION = 2 as const;

/** Ordered accepted-attempt IDs for the single active collection session. */
export type CollectionAttemptIdsByClass = Partial<
  Record<BaybayinClass, readonly string[]>
>;

export interface CollectionProgress {
  targetCharacterCount: number;
  expectedAttemptCount: number;
  completedAttemptCount: number;
  completedCharacterCount: number;
  isComplete: boolean;
}

/** Read the persisted accepted-attempt count for one target. */
export function getAcceptedAttemptCount(
  attemptIdsByClass: CollectionAttemptIdsByClass,
  targetClass: BaybayinClass,
): number {
  return attemptIdsByClass[targetClass]?.length ?? 0;
}

/** Return the next incomplete target without changing canonical target order. */
export function getNextIncompleteTarget(
  attemptIdsByClass: CollectionAttemptIdsByClass,
  targets: readonly BaybayinClass[] = BAYBAYIN_CLASSES,
): BaybayinClass | null {
  return targets.find(
    target => getAcceptedAttemptCount(attemptIdsByClass, target) < ATTEMPTS_PER_CHARACTER,
  ) ?? null;
}

/** Calculate capped protocol progress from persisted active-session membership. */
export function getCollectionProgress(
  attemptIdsByClass: CollectionAttemptIdsByClass,
  targets: readonly BaybayinClass[] = BAYBAYIN_CLASSES,
): CollectionProgress {
  let completedAttemptCount = 0;
  let completedCharacterCount = 0;

  for (const target of targets) {
    const acceptedCount = getAcceptedAttemptCount(attemptIdsByClass, target);
    completedAttemptCount += Math.min(acceptedCount, ATTEMPTS_PER_CHARACTER);
    if (acceptedCount >= ATTEMPTS_PER_CHARACTER) completedCharacterCount += 1;
  }

  const targetCharacterCount = targets.length;
  return {
    targetCharacterCount,
    expectedAttemptCount: targetCharacterCount * ATTEMPTS_PER_CHARACTER,
    completedAttemptCount,
    completedCharacterCount,
    isComplete: completedCharacterCount === targetCharacterCount,
  };
}

// ---------------------------------------------------------------------------
// New dataset-format stroke types
//
// NOTE: These are intentionally separate from the legacy StrokePoint/Stroke
// types above.
//
//   StrokePoint.t         = absolute Date.now() epoch ms  (legacy, unchanged)
//   RecordedStrokePoint.t = elapsed ms from attempt start  (performance.now() delta)
//
// Both types coexist in the codebase. Do not merge them.
// ---------------------------------------------------------------------------

/** A single coordinate sample within a recorded stroke. */
export interface RecordedStrokePoint {
  /** Raw canvas pixel X coordinate — NOT normalised. */
  x: number;
  /** Raw canvas pixel Y coordinate — NOT normalised. */
  y: number;
  /**
   * Elapsed milliseconds since the FIRST touch-down of the complete attempt.
   * Derived from performance.now() deltas — NOT Date.now().
   * t === 0 for the very first point of the entire attempt.
   * Increases monotonically across all strokes.
   */
  t: number;
}

/** A single continuous pen-down → pen-up stroke within a handwriting attempt. */
export interface RecordedStroke {
  /** 0-based index within the attempt. */
  strokeId: number;
  /**
   * Elapsed ms at the moment of touch-down (performance.now() delta from
   * attempt start). Preserved independently of points so tap/dot timing
   * is available even when the stroke has only one point.
   */
  startedAtMs: number;
  /**
   * Elapsed ms at the moment of touch-up (performance.now() delta from
   * attempt start).
   */
  endedAtMs: number;
  /** Ordered sequence of coordinate samples within this stroke. */
  points: RecordedStrokePoint[];
}

/** Review lifecycle state of a handwriting sample. */
export type ReviewStatus = 'unreviewed' | 'reviewed';

// ---------------------------------------------------------------------------
// Full HandwritingAttempt domain type
//
// Returned by the persistence layer after a sample has been saved.
// The review fields (observedClass, visualValid, strokeValid, rubricVersion)
// are always null for newly collected samples and are set only during review.
// ---------------------------------------------------------------------------
export interface HandwritingAttempt {
  /** Schema version. Legacy attempts are version 1; new five-attempt records are version 2. */
  schemaVersion: number;

  /** UUID uniquely identifying this attempt. */
  attemptId: string;

  /** 1-based accepted-attempt ordinal; null only for legacy version-1 rows. */
  attemptNumber: number | null;

  /** Participant identifier when available; null for anonymous sessions. */
  participantId: string | null;

  /**
   * Reference to the lesson activity that requested this character.
   * Null for prototype/debug sessions with no backing activity row.
   */
  activityId: string | null;

  /**
   * The Baybayin character the learner was ASKED to draw.
   * Source of truth comes from the current practice activity configuration.
   * NEVER inferred from stroke coordinates, image appearance, or model output.
   */
  targetClass: BaybayinClass;

  /**
   * What the completed drawing actually appears to be, determined by human
   * review or future model evaluation. Null until reviewed.
   * NEVER assumed to equal targetClass.
   */
  observedClass: BaybayinClass | null;

  /** Canvas width in logical pixels at collection time. */
  canvasWidth: number;
  /** Canvas height in logical pixels at collection time. */
  canvasHeight: number;
  /** App window width in logical pixels at collection time. */
  screenWidth?: number;
  /** App window height in logical pixels at collection time. */
  screenHeight?: number;
  /** Device pixel ratio (scale factor). */
  pixelRatio?: number;
  /** UI layout mode during collection ('compact' | 'phone' | 'tablet'). */
  layoutMode?: string;
  /** Version of the BAYA app that collected this sample. */
  appVersion?: string;

  /**
   * Total attempt duration in milliseconds.
   * Measured as performance.now() delta from first touch-down to last touch-up.
   */
  durationMs: number;

  /** All strokes in the order they were drawn. */
  strokes: RecordedStroke[];

  /**
   * Local file URI of the final canvas PNG image.
   * Null if image capture failed (stroke data is still persisted).
   * The image and this record share the same attemptId.
   */
  imageUri: string | null;

  /** Whether this sample has been through the review process. */
  reviewStatus: ReviewStatus;

  /** Whether the final image is visually valid (null = not yet reviewed). */
  visualValid: boolean | null;

  /** Whether the stroke sequence is mechanically valid (null = not yet reviewed). */
  strokeValid: boolean | null;

  /** Identifier of the evaluation rubric used for this review, if any. */
  rubricVersion: string | null;

  /** Unix epoch ms (Date.now()) at the moment of submission. */
  createdAt: number;
}

// ---------------------------------------------------------------------------
// NewHandwritingAttemptDraft — input type for new data collection
//
// Only contains data that is KNOWN during the drawing session.
// Review fields (observedClass, visualValid, strokeValid, rubricVersion,
// reviewStatus, schemaVersion) are NOT included — the persistence layer
// sets those to their correct initial null/default values.
//
// This makes it structurally impossible for collection code to accidentally
// label an attempt as correct or to leave schemaVersion unset.
// ---------------------------------------------------------------------------
export interface NewHandwritingAttemptDraft {
  /** UUID for this attempt — generated before saving so the image and DB row share it. */
  attemptId: string;
  /** 1-based ordinal within the target class for the active collection session. */
  attemptNumber: number;
  participantId: string | null;
  activityId:    string | null;
  /** The character the learner was asked to draw. */
  targetClass:   BaybayinClass;
  canvasWidth:   number;
  canvasHeight:  number;
  screenWidth?:  number;
  screenHeight?: number;
  pixelRatio?:   number;
  layoutMode?:   string;
  appVersion?:   string;
  /** performance.now() delta from first touch-down to last touch-up. */
  durationMs:    number;
  strokes:       RecordedStroke[];
  /** URI returned by the image-save step; null if image capture failed. */
  imageUri:      string | null;
  /** Date.now() at submission — the only field that uses wall-clock time. */
  createdAt:     number;
}

