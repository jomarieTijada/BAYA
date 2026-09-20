/**
 * apps/mobile/src/services/handwritingStorage.ts
 *
 * Atomic persistence facade for handwriting attempts.
 *
 * Responsibilities:
 *   1. Save canvas PNG images to durable document storage
 *      (uses expo-file-system v57 File/Directory/Paths API).
 *   2. Persist attempt metadata + strokes to SQLite via handwritingRepository.
 *   3. Guarantee atomicity: image and DB row are always in sync.
 *      - If image save fails    → no DB row is written.
 *      - If DB insert fails     → the orphan image file is deleted.
 *
 * Image path pattern:
 *   <documentDirectory>/baya/handwriting/attempt_<attemptId>.png
 *
 * expo-file-system v57 API used:
 *   import { File, Directory, Paths } from 'expo-file-system';
 *   new Directory(Paths.document, 'baya', 'handwriting').create({ intermediates: true })
 *   new File(dir, `attempt_${id}.png`).write(bytes)
 */

import { File, Directory, Paths } from 'expo-file-system';
import {
  HANDWRITING_SCHEMA_VERSION,
  type NewHandwritingAttemptDraft,
  type HandwritingAttempt,
} from '@baya/shared-types';
import {
  insertHandwritingSample,
  getHandwritingSample,
  getLatestHandwritingSample,
  insertSampleAndAdvanceSession,
  replaceSampleAndAdvanceSession,
  deleteSampleAndRecedeSession,
} from '../../../../packages/db/src/handwritingRepository';
import type { BayaDatabase } from '../db/client';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HANDWRITING_DIR_SEGMENTS = ['baya', 'handwriting'] as const;

// ---------------------------------------------------------------------------
// Image storage — expo-file-system v57
// ---------------------------------------------------------------------------

/**
 * Returns a File instance for the attempt image.
 * Does NOT create the directory — caller must ensure it exists first.
 */
function getAttemptImageFile(attemptId: string): File {
  return new File(Paths.document, ...HANDWRITING_DIR_SEGMENTS, `attempt_${attemptId}.png`);
}

/**
 * Ensures the handwriting image directory exists (creates it if needed).
 */
async function ensureHandwritingDirectory(): Promise<void> {
  const rootDir = new Directory(Paths.document);
  const bayaDir = new Directory(rootDir, 'baya');
  if (!bayaDir.exists) bayaDir.create();
  
  const hwDir = new Directory(bayaDir, 'handwriting');
  if (!hwDir.exists) hwDir.create();
}

/**
 * Saves raw PNG bytes to durable document storage.
 *
 * @param imageBytes  Uint8Array from SkImage.encodeToBytes(ImageFormat.PNG)
 * @param attemptId   The attempt UUID (used as part of the filename)
 * @returns           The file:// URI of the saved image
 * @throws            If the write fails
 */
export async function saveAttemptImage(
  imageBytes: Uint8Array,
  attemptId: string,
): Promise<string> {
  await ensureHandwritingDirectory();
  const file = getAttemptImageFile(attemptId);
  file.write(imageBytes);
  return file.uri;
}

/**
 * Deletes an attempt image file.
 * Used to clean up orphan images when the DB insert fails.
 * Swallows errors — a failed delete should not mask the original DB error.
 */
export async function deleteAttemptImage(uri: string): Promise<void> {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch (e) {
    console.warn('[handwritingStorage] Failed to delete orphan image:', uri, e);
  }
}

// ---------------------------------------------------------------------------
// Atomic persistence
// ---------------------------------------------------------------------------

/**
 * Atomically saves a handwriting attempt (image + SQLite row).
 *
 * Failure handling:
 *   - If `imageBytes` is null or empty, the promise is rejected. Every training
 *     sample must have a matching image.
 *   - If image write throws → propagates immediately, no DB row written.
 *   - If DB insert throws  → deletes the orphan image, then re-throws.
 *
 * @param db          Drizzle database instance
 * @param draft       Collection-time data (no review fields)
 * @param imageBytes  PNG bytes from captureImage()
 */
export async function commitReviewedHandwritingAttempt(
  db: BayaDatabase,
  draft: Omit<NewHandwritingAttemptDraft, 'imageUri'>,
  imageBytes: Uint8Array | null,
): Promise<HandwritingAttempt> {
  if (imageBytes == null || imageBytes.length === 0) {
    throw new Error('[handwritingStorage] Cannot save attempt without an image.');
  }

  const { getHandwritingSample, insertSampleAndAdvanceSession } = require('../../../../packages/db/src/handwritingRepository');

  // Idempotency Pre-Check: If DB row already exists, return it immediately.
  // This prevents blindly overwriting existing valid PNGs on a duplicate retry.
  const existing = await getHandwritingSample(db as any, draft.attemptId);
  if (existing) {
    console.warn(`[handwritingStorage] Attempt ${draft.attemptId} already exists. Returning existing.`);
    return existing;
  }

  // Step 1: Save image to filesystem (compensatable action).
  const imageUri = await saveAttemptImage(imageBytes, draft.attemptId);

  // Step 2: Atomic SQLite Transaction.
  // Both the handwriting row AND the session state are committed together.
  try {
    await insertSampleAndAdvanceSession(db as any, {
      ...draft,
      imageUri,
    });
    
    // Step 3: Return exact committed state
    return {
      ...draft,
      imageUri,
      observedClass: null,
      reviewStatus: 'unreviewed',
      visualValid: null,
      strokeValid: null,
      rubricVersion: null,
      schemaVersion: HANDWRITING_SCHEMA_VERSION,
    };
  } catch (dbError) {
    // A duplicate commit may have won between the idempotency pre-check and
    // this transaction. Never delete the shared PNG if its row now exists.
    const concurrentlyCommitted = await getHandwritingSample(db as any, draft.attemptId);
    if (concurrentlyCommitted) return concurrentlyCommitted;

    // Genuine failure: the DB transaction rolled back, so compensate the FS.
    await deleteAttemptImage(imageUri);
    throw dbError;
  }
}

// ---------------------------------------------------------------------------
// Load helpers (wrappers around repository for convenience)
// ---------------------------------------------------------------------------

/** Load a specific attempt by ID. Returns null if not found. */
export async function loadHandwritingAttempt(
  db: BayaDatabase,
  id: string,
): Promise<HandwritingAttempt | null> {
  return getHandwritingSample(db as Parameters<typeof getHandwritingSample>[0], id);
}

/** Load the most recently created attempt. Returns null if none exist. */
export async function loadLatestHandwritingAttempt(
  db: BayaDatabase,
): Promise<HandwritingAttempt | null> {
  return getLatestHandwritingSample(db as Parameters<typeof getLatestHandwritingSample>[0]);
}

/** Deletes an attempt from the DB and its orphan image file. */
export async function deleteHandwritingAttempt(
  db: BayaDatabase,
  id: string,
  imageUri: string | null,
): Promise<void> {
  // Delete DB row first
  const { deleteHandwritingSample } = require('../../../../packages/db/src/handwritingRepository');
  await deleteHandwritingSample(db as Parameters<typeof deleteHandwritingSample>[0], id);
  // Delete image
  if (imageUri) {
    await deleteAttemptImage(imageUri);
  }
}

export async function commitRetakeHandwritingAttempt(
  db: BayaDatabase,
  oldAttemptId: string,
  draft: Omit<NewHandwritingAttemptDraft, 'imageUri'>,
  imageBytes: Uint8Array | null,
): Promise<HandwritingAttempt> {
  if (imageBytes == null || imageBytes.length === 0) throw new Error('No image.');

  const oldAttempt = await getHandwritingSample(db as any, oldAttemptId);
  if (!oldAttempt || oldAttempt.targetClass !== draft.targetClass) {
    throw new Error(`Retake failed: attempt ${oldAttemptId} is no longer active.`);
  }

  const existing = await getHandwritingSample(db as any, draft.attemptId);
  if (existing) {
    if (oldAttempt.imageUri) await deleteAttemptImage(oldAttempt.imageUri);
    return existing;
  }

  const imageUri = await saveAttemptImage(imageBytes, draft.attemptId);

  try {
    await replaceSampleAndAdvanceSession(db as any, oldAttemptId, { ...draft, imageUri });
    if (oldAttempt.imageUri) await deleteAttemptImage(oldAttempt.imageUri);
    return { ...draft, imageUri, observedClass: null, reviewStatus: 'unreviewed', visualValid: null, strokeValid: null, rubricVersion: null, schemaVersion: HANDWRITING_SCHEMA_VERSION };
  } catch (err) {
    const concurrentlyCommitted = await getHandwritingSample(db as any, draft.attemptId);
    if (concurrentlyCommitted) {
      if (oldAttempt.imageUri) await deleteAttemptImage(oldAttempt.imageUri);
      return concurrentlyCommitted;
    }
    await deleteAttemptImage(imageUri);
    throw err;
  }
}

export async function commitDeleteHandwritingAttempt(
  db: BayaDatabase,
  targetClass: import('@baya/shared-types').BaybayinClass,
  attemptId: string,
  imageUri: string | null
): Promise<void> {
  await deleteSampleAndRecedeSession(db as any, targetClass, attemptId);
  // Best-effort image cleanup
  if (imageUri) {
    try {
      await deleteAttemptImage(imageUri);
    } catch (e) {
      console.warn('Failed to clean up old image:', e);
    }
  }
}
