/**
 * packages/db/src/handwritingRepository.ts
 *
 * Pure data-access functions for the HANDWRITING_SAMPLES table.
 * No React, no Expo — fully unit-testable in isolation.
 *
 * Key invariant:
 *   insertHandwritingSample accepts a NewHandwritingAttemptDraft (collection
 *   data only) and sets all review fields to their correct initial null/default
 *   values. Callers CANNOT accidentally label an attempt correct at collection
 *   time because the review fields are not part of the input type.
 */

import { desc, eq, count as drizzleCount } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import type {
  HandwritingAttempt,
  NewHandwritingAttemptDraft,
  RecordedStroke,
  BaybayinClass,
  ReviewStatus,
} from '@baya/shared-types';
import {
  ATTEMPTS_PER_CHARACTER,
  BAYBAYIN_CLASSES,
  HANDWRITING_SCHEMA_VERSION,
  getCollectionProgress,
} from '@baya/shared-types';
import { handwritingSamples, collectionSessionState } from './schema.sqlite';

// ---------------------------------------------------------------------------
// Type helpers
// ---------------------------------------------------------------------------

/** Narrow a raw string to BaybayinClass, returning null for unknown values. */
function toBaybayinClass(value: string | null | undefined): BaybayinClass | null {
  if (value == null) return null;
  // BAYBAYIN_CLASSES is a readonly tuple — cast to readonly string[] for includes check
  if ((BAYBAYIN_CLASSES as readonly string[]).includes(value)) {
    return value as BaybayinClass;
  }
  return null;
}

/** Deserialize strokes_json from the DB row into RecordedStroke[]. */
function parseStrokes(strokesJson: string): RecordedStroke[] {
  try {
    const parsed: unknown = JSON.parse(strokesJson);
    if (!Array.isArray(parsed)) return [];
    return parsed as RecordedStroke[];
  } catch {
    return [];
  }
}

/** Map a raw DB row to the domain HandwritingAttempt type. */
function rowToAttempt(
  row: typeof handwritingSamples.$inferSelect
): HandwritingAttempt {
  return {
    schemaVersion: row.schemaVersion,
    attemptId:     row.id,
    attemptNumber: row.attemptNumber ?? null,
    participantId: row.participantId ?? null,
    activityId:    row.activityId ?? null,
    targetClass:   row.targetClass as BaybayinClass, // stored from BaybayinClass, safe cast
    observedClass: toBaybayinClass(row.observedClass),
    canvasWidth:   row.canvasWidth,
    canvasHeight:  row.canvasHeight,
    screenWidth:   row.screenWidth ?? undefined,
    screenHeight:  row.screenHeight ?? undefined,
    pixelRatio:    row.pixelRatio ?? undefined,
    layoutMode:    row.layoutMode ?? undefined,
    appVersion:    row.appVersion ?? undefined,
    durationMs:    row.durationMs,
    strokes:       parseStrokes(row.strokesJson),
    imageUri:      row.imageUri ?? null,
    reviewStatus:  (row.reviewStatus as ReviewStatus) ?? 'unreviewed',
    visualValid:   row.visualValid === 1 ? true : row.visualValid === 0 ? false : null,
    strokeValid:   row.strokeValid  === 1 ? true : row.strokeValid  === 0 ? false : null,
    rubricVersion: row.rubricVersion ?? null,
    createdAt:     row.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------

/**
 * Persist a newly collected handwriting attempt.
 *
 * The persistence layer is responsible for setting all review-lifecycle fields:
 *   observedClass  = null
 *   reviewStatus   = 'unreviewed'
 *   visualValid    = null
 *   strokeValid    = null
 *   rubricVersion  = null
 *   schemaVersion  = HANDWRITING_SCHEMA_VERSION
 *
 * These are NOT accepted from the caller — the NewHandwritingAttemptDraft type
 * structurally prevents passing them.
 */
export async function insertHandwritingSample(
  db: ExpoSQLiteDatabase<Record<string, unknown>>,
  draft: NewHandwritingAttemptDraft,
): Promise<void> {
  insertHandwritingSampleSync(db, draft);
}

function insertHandwritingSampleSync(
  db: any,
  draft: NewHandwritingAttemptDraft,
): void {
  db.insert(handwritingSamples).values(buildNewHandwritingSampleValues(draft)).run();
}

/**
 * Build the exact row used by every new insert and retake.
 * Exported for invariant tests; it does not read or mutate persisted data.
 */
export function buildNewHandwritingSampleValues(
  draft: NewHandwritingAttemptDraft,
): typeof handwritingSamples.$inferInsert {
  return {
    id:            draft.attemptId,
    participantId: draft.participantId,
    activityId:    draft.activityId,
    targetClass:   draft.targetClass,
    attemptNumber: draft.attemptNumber,
    // Review fields — always null on newly collected samples:
    observedClass: null,
    reviewStatus:  'unreviewed',
    visualValid:   null,
    strokeValid:   null,
    rubricVersion: null,
    schemaVersion: HANDWRITING_SCHEMA_VERSION,
    // Collection data:
    imageUri:      draft.imageUri,
    strokesJson:   JSON.stringify(draft.strokes),
    canvasWidth:   draft.canvasWidth,
    canvasHeight:  draft.canvasHeight,
    screenWidth:   draft.screenWidth,
    screenHeight:  draft.screenHeight,
    pixelRatio:    draft.pixelRatio,
    layoutMode:    draft.layoutMode,
    appVersion:    draft.appVersion,
    durationMs:    draft.durationMs,
    createdAt:     draft.createdAt,
  };
}

/**
 * Delete a handwriting attempt by its UUID.
 */
export async function deleteHandwritingSample(
  db: ExpoSQLiteDatabase<Record<string, unknown>>,
  id: string,
): Promise<void> {
  await db
    .delete(handwritingSamples)
    .where(eq(handwritingSamples.id, id));
}

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

/** Retrieve a single attempt by its UUID. Returns null if not found. */
export async function getHandwritingSample(
  db: ExpoSQLiteDatabase<Record<string, unknown>>,
  id: string,
): Promise<HandwritingAttempt | null> {
  const rows = await db
    .select()
    .from(handwritingSamples)
    .where(eq(handwritingSamples.id, id))
    .limit(1);

  return rows[0] != null ? rowToAttempt(rows[0]) : null;
}

/** Retrieve the most recently created attempt. Returns null if table is empty. */
export async function getLatestHandwritingSample(
  db: ExpoSQLiteDatabase<Record<string, unknown>>,
): Promise<HandwritingAttempt | null> {
  const rows = await db
    .select()
    .from(handwritingSamples)
    .orderBy(desc(handwritingSamples.createdAt))
    .limit(1);

  return rows[0] != null ? rowToAttempt(rows[0]) : null;
}

/** List attempts ordered by most recent first, with an optional row limit. */
export async function listHandwritingSamples(
  db: ExpoSQLiteDatabase<Record<string, unknown>>,
  limit = 50,
): Promise<HandwritingAttempt[]> {
  const rows = await db
    .select()
    .from(handwritingSamples)
    .orderBy(desc(handwritingSamples.createdAt))
    .limit(limit);

  return rows.map(rowToAttempt);
}

/** Retrieve all handwriting attempts for export. */
export async function getAllHandwritingSamples(
  db: ExpoSQLiteDatabase<Record<string, unknown>>,
): Promise<HandwritingAttempt[]> {
  const rows = await db
    .select()
    .from(handwritingSamples)
    .orderBy(desc(handwritingSamples.createdAt));

  return rows.map(rowToAttempt);
}

/** Get the total number of handwriting samples. */
export async function getHandwritingSampleCount(
  db: ExpoSQLiteDatabase<Record<string, unknown>>,
): Promise<number> {
  const rows = await db
    .select({ count: drizzleCount() })
    .from(handwritingSamples);
  return rows[0]?.count ?? 0;
}

// ---------------------------------------------------------------------------
// Collection Session State
// ---------------------------------------------------------------------------

export interface CollectionSessionState {
  id: string;
  attemptIdsByClass: Partial<Record<BaybayinClass, string[]>>;
  isComplete: boolean;
  updatedAt: number;
}

function isBaybayinClass(value: string): value is BaybayinClass {
  return (BAYBAYIN_CLASSES as readonly string[]).includes(value);
}

function sanitizeAttemptIdsByClass(
  input: CollectionSessionState['attemptIdsByClass'],
): CollectionSessionState['attemptIdsByClass'] {
  const result: CollectionSessionState['attemptIdsByClass'] = {};

  for (const targetClass of BAYBAYIN_CLASSES) {
    const ids = input[targetClass];
    if (!Array.isArray(ids)) continue;

    const uniqueIds = ids.filter(
      (id, index): id is string =>
        typeof id === 'string' && id.length > 0 && ids.indexOf(id) === index,
    );
    if (uniqueIds.length > 0) result[targetClass] = uniqueIds;
  }

  return result;
}

/**
 * Normalize every historical session JSON shape into ordered ID arrays.
 *
 * Supported legacy shapes:
 *   - string[]                         (old flat completed-attempt list)
 *   - Record<BaybayinClass, string>    (one accepted attempt per class)
 *   - Record<BaybayinClass, string[]>  (current representation)
 *
 * Every referenced row is verified before it can contribute to progress.
 */
interface SessionAttemptReference {
  attemptId: string;
  expectedTarget?: BaybayinClass;
}

function parseCollectionSessionReferences(rawJson: string): SessionAttemptReference[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (error) {
    console.error('[handwritingRepository] Failed to parse session JSON:', error);
    return [];
  }

  if (Array.isArray(parsed)) {
    return parsed
      .filter((attemptId): attemptId is string => typeof attemptId === 'string')
      .map(attemptId => ({ attemptId }));
  }

  if (typeof parsed !== 'object' || parsed === null) return [];

  const references: SessionAttemptReference[] = [];
  for (const [rawTarget, rawIds] of Object.entries(parsed)) {
    if (!isBaybayinClass(rawTarget)) continue;
    const ids = Array.isArray(rawIds) ? rawIds : [rawIds];
    for (const attemptId of ids) {
      if (typeof attemptId === 'string') {
        references.push({ attemptId, expectedTarget: rawTarget });
      }
    }
  }
  return references;
}

function addVerifiedAttempt(
  result: CollectionSessionState['attemptIdsByClass'],
  attempt: Pick<HandwritingAttempt, 'attemptId' | 'targetClass'> | null,
  reference: SessionAttemptReference,
): void {
  if (!attempt || !isBaybayinClass(attempt.targetClass)) return;
  if (reference.expectedTarget != null && attempt.targetClass !== reference.expectedTarget) return;

  const currentIds = result[attempt.targetClass] ?? [];
  if (!currentIds.includes(reference.attemptId)) {
    result[attempt.targetClass] = [...currentIds, reference.attemptId];
  }
}

export async function normalizeCollectionSessionJson(
  rawJson: string,
  loadAttempt: (
    attemptId: string,
  ) => Promise<Pick<HandwritingAttempt, 'attemptId' | 'targetClass'> | null>,
): Promise<CollectionSessionState['attemptIdsByClass']> {
  const result: CollectionSessionState['attemptIdsByClass'] = {};
  for (const reference of parseCollectionSessionReferences(rawJson)) {
    addVerifiedAttempt(result, await loadAttempt(reference.attemptId), reference);
  }
  return result;
}

function normalizeCollectionSessionJsonSync(
  rawJson: string,
  attemptsById: ReadonlyMap<
    string,
    Pick<HandwritingAttempt, 'attemptId' | 'targetClass'>
  >,
): CollectionSessionState['attemptIdsByClass'] {
  const result: CollectionSessionState['attemptIdsByClass'] = {};
  for (const reference of parseCollectionSessionReferences(rawJson)) {
    addVerifiedAttempt(result, attemptsById.get(reference.attemptId) ?? null, reference);
  }
  return result;
}

function getCollectionSessionStateSync(db: any): CollectionSessionState | null {
  const row = db
    .select()
    .from(collectionSessionState)
    .where(eq(collectionSessionState.id, 'active'))
    .limit(1)
    .all()[0] as typeof collectionSessionState.$inferSelect | undefined;

  if (!row) return null;

  const attemptRows = db
    .select({
      attemptId: handwritingSamples.id,
      targetClass: handwritingSamples.targetClass,
    })
    .from(handwritingSamples)
    .all() as Array<{ attemptId: string; targetClass: string }>;
  const attemptsById = new Map(
    attemptRows
      .filter(attempt => isBaybayinClass(attempt.targetClass))
      .map(attempt => [
        attempt.attemptId,
        { attemptId: attempt.attemptId, targetClass: attempt.targetClass as BaybayinClass },
      ]),
  );

  const attemptIdsByClass = normalizeCollectionSessionJsonSync(
    row.completedAttemptIdsJson,
    attemptsById,
  );
  const progress = getCollectionProgress(attemptIdsByClass);
  const normalizedJson = JSON.stringify(attemptIdsByClass);

  if (
    normalizedJson !== row.completedAttemptIdsJson ||
    row.isComplete !== progress.isComplete
  ) {
    db
      .update(collectionSessionState)
      .set({
        completedAttemptIdsJson: normalizedJson,
        isComplete: progress.isComplete,
        updatedAt: Date.now(),
      })
      .where(eq(collectionSessionState.id, 'active'))
      .run();
  }

  return {
    id: row.id,
    attemptIdsByClass,
    isComplete: progress.isComplete,
    updatedAt: row.updatedAt,
  };
}

export async function getCollectionSessionState(
  db: ExpoSQLiteDatabase<Record<string, unknown>>
): Promise<CollectionSessionState | null> {
  return getCollectionSessionStateSync(db);
}

function upsertCollectionSessionStateSync(
  db: any,
  state: CollectionSessionState,
): void {
  const attemptIdsByClass = sanitizeAttemptIdsByClass(state.attemptIdsByClass);
  const { isComplete } = getCollectionProgress(attemptIdsByClass);

  db
    .insert(collectionSessionState)
    .values({
      id: state.id,
      completedAttemptIdsJson: JSON.stringify(attemptIdsByClass),
      isComplete,
      updatedAt: state.updatedAt,
    })
    .onConflictDoUpdate({
      target: collectionSessionState.id,
      set: {
        completedAttemptIdsJson: JSON.stringify(attemptIdsByClass),
        isComplete,
        updatedAt: state.updatedAt,
      },
    })
    .run();
}

export async function upsertCollectionSessionState(
  db: ExpoSQLiteDatabase<Record<string, unknown>>,
  state: CollectionSessionState
): Promise<void> {
  upsertCollectionSessionStateSync(db, state);
}

/**
 * Load every accepted attempt in canonical target order and acceptance order.
 * Legacy rows with a null attempt_number receive a derived 1-based ordinal in
 * the returned domain object; the legacy database row itself is not rewritten.
 */
export async function getCollectionSessionAttempts(
  db: ExpoSQLiteDatabase<Record<string, unknown>>,
  providedState?: CollectionSessionState,
): Promise<HandwritingAttempt[]> {
  const state = providedState ?? await getCollectionSessionState(db);
  if (!state) return [];

  const allAttempts = await getAllHandwritingSamples(db);
  const attemptsById = new Map(allAttempts.map(attempt => [attempt.attemptId, attempt]));
  const orderedAttempts: HandwritingAttempt[] = [];

  for (const targetClass of BAYBAYIN_CLASSES) {
    const attemptIds = state.attemptIdsByClass[targetClass] ?? [];
    attemptIds.forEach((attemptId, index) => {
      const attempt = attemptsById.get(attemptId);
      if (attempt?.targetClass === targetClass) {
        orderedAttempts.push({ ...attempt, attemptNumber: index + 1 });
      }
    });
  }

  return orderedAttempts;
}

export async function insertSampleAndAdvanceSession(
  db: ExpoSQLiteDatabase<Record<string, unknown>>,
  draft: Omit<NewHandwritingAttemptDraft, "imageUri"> & { imageUri: string | null }
): Promise<void> {
  db.transaction((tx: any) => {
    let sessionState = getCollectionSessionStateSync(tx);
    if (!sessionState) {
      sessionState = { id: 'active', attemptIdsByClass: {}, isComplete: false, updatedAt: Date.now() };
    }

    const acceptedIds = sessionState.attemptIdsByClass[draft.targetClass] ?? [];
    if (acceptedIds.length >= ATTEMPTS_PER_CHARACTER) {
      throw new Error(`Target ${draft.targetClass} already has ${ATTEMPTS_PER_CHARACTER} accepted attempts.`);
    }

    const expectedAttemptNumber = acceptedIds.length + 1;
    if (draft.attemptNumber !== expectedAttemptNumber) {
      throw new Error(
        `Stale attempt number for ${draft.targetClass}: expected ${expectedAttemptNumber}, received ${draft.attemptNumber}.`,
      );
    }

    insertHandwritingSampleSync(tx, draft as any);
    sessionState.attemptIdsByClass[draft.targetClass] = [...acceptedIds, draft.attemptId];
    sessionState.updatedAt = Date.now();
    upsertCollectionSessionStateSync(tx, sessionState);
  });
}

export async function replaceSampleAndAdvanceSession(
  db: ExpoSQLiteDatabase<Record<string, unknown>>,
  oldAttemptId: string,
  draft: Omit<NewHandwritingAttemptDraft, "imageUri"> & { imageUri: string | null }
): Promise<void> {
  db.transaction((tx: any) => {
    const sessionState = getCollectionSessionStateSync(tx);
    const acceptedIds = sessionState?.attemptIdsByClass[draft.targetClass] ?? [];
    const replaceIndex = acceptedIds.indexOf(oldAttemptId);
    if (!sessionState || replaceIndex < 0) {
      throw new Error(`Retake failed: stale mapping for ${draft.targetClass}`);
    }

    const expectedAttemptNumber = replaceIndex + 1;
    if (draft.attemptNumber !== expectedAttemptNumber) {
      throw new Error(
        `Retake failed: expected attempt ${expectedAttemptNumber}, received ${draft.attemptNumber}.`,
      );
    }

    insertHandwritingSampleSync(tx, draft as any);

    const nextIds = [...acceptedIds];
    nextIds[replaceIndex] = draft.attemptId;
    sessionState.attemptIdsByClass[draft.targetClass] = nextIds;
    sessionState.updatedAt = Date.now();
    upsertCollectionSessionStateSync(tx, sessionState);

    tx.delete(handwritingSamples).where(eq(handwritingSamples.id, oldAttemptId)).run();
  });
}

/**
 * Reset the active collection session so the next person can start from scratch.
 *
 * Deletes the "active" session tracking row — all historical HANDWRITING_SAMPLES
 * rows are preserved. A fresh session will be created automatically the next
 * time the user submits an attempt.
 */
export async function resetCollectionSession(
  db: ExpoSQLiteDatabase<Record<string, unknown>>,
): Promise<void> {
  await db
    .delete(collectionSessionState)
    .where(eq(collectionSessionState.id, 'active'));
}

export async function deleteSampleAndRecedeSession(
  db: ExpoSQLiteDatabase<Record<string, unknown>>,
  targetClass: BaybayinClass,
  attemptId: string
): Promise<void> {
  db.transaction((tx: any) => {
    const sessionState = getCollectionSessionStateSync(tx);
    const acceptedIds = sessionState?.attemptIdsByClass[targetClass] ?? [];
    const deleteIndex = acceptedIds.indexOf(attemptId);
    if (!sessionState || deleteIndex < 0) {
      throw new Error(`Delete failed: stale mapping for ${targetClass}`);
    }

    const remainingIds = acceptedIds.filter(id => id !== attemptId);
    if (remainingIds.length > 0) {
      sessionState.attemptIdsByClass[targetClass] = remainingIds;
    } else {
      delete sessionState.attemptIdsByClass[targetClass];
    }
    sessionState.updatedAt = Date.now();
    upsertCollectionSessionStateSync(tx, sessionState);

    tx.delete(handwritingSamples).where(eq(handwritingSamples.id, attemptId)).run();

    // Keep explicit ordinals contiguous after an intentional deletion. Legacy
    // null ordinals become explicit only as part of this user-requested edit.
    for (let index = 0; index < remainingIds.length; index += 1) {
      tx
        .update(handwritingSamples)
        .set({ attemptNumber: index + 1 })
        .where(eq(handwritingSamples.id, remainingIds[index]))
        .run();
    }
  });
}
