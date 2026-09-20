/**
 * apps/mobile/src/services/datasetExport.ts
 *
 * Exports the current active collection session to a ZIP archive.
 *
 * IMPORTANT: This uses the expo-file-system v57 NEW API (File class).
 * Do NOT use `import * as FileSystem from 'expo-file-system'` functions like
 * `readAsStringAsync` — those are DEPRECATED stubs that throw at runtime in v57.
 *
 * Correct read API: new File(uri).base64()
 * Correct write API: new File(path).write(bytes)
 */

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import JSZip from 'jszip';
import type { BayaDatabase } from '../db/client';
import {
  getCollectionSessionAttempts,
  getCollectionSessionState,
} from '../../../../packages/db/src/handwritingRepository';
import {
  buildDatasetMetadata,
  buildExportAttemptRecord,
  getExportImageFilename,
} from './datasetManifest';

// ---------------------------------------------------------------------------
// Canonical image file resolver — matches handwritingStorage.ts exactly.
// ---------------------------------------------------------------------------

const HANDWRITING_DIR_SEGMENTS = ['baya', 'handwriting'] as const;

/**
 * Reconstructs the canonical File for a saved attempt image.
 * This MUST use the same path pattern as handwritingStorage.ts:
 *   <documentDirectory>/baya/handwriting/attempt_<attemptId>.png
 *
 * We reconstruct from the attemptId rather than parsing imageUri, because
 * the stored imageUri may be a file:// URI that differs from what new File()
 * expects. This is the most reliable path.
 */
function getExportImageFile(attemptId: string): File {
  return new File(Paths.document, ...HANDWRITING_DIR_SEGMENTS, `attempt_${attemptId}.png`);
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export async function exportDataset(db: BayaDatabase): Promise<void> {
  console.log('[BAYA Export] Starting export...');

  // 1. Fetch current session
  const sessionState = await getCollectionSessionState(db as any);
  if (!sessionState) {
    throw new Error('No active collection session found.');
  }

  const attempts = await getCollectionSessionAttempts(db as any, sessionState);
  if (attempts.length === 0) {
    throw new Error('No saved attempts to export in the current session.');
  }

  console.log(`[BAYA Export] Loaded ${attempts.length} active-session attempts from SQLite.`);

  // 3. Build ZIP
  const zip = new JSZip();
  const imagesFolder = zip.folder('images');
  if (!imagesFolder) throw new Error('Could not create images/ folder in ZIP.');

  const exportAttempts: ReturnType<typeof buildExportAttemptRecord>[] = [];
  const imageFailures: string[] = [];

  for (const attempt of attempts) {
    const filename = getExportImageFilename(attempt.attemptId);

    // Canonical file resolution: reconstruct from attemptId using the same
    // path pattern as handwritingStorage.ts. Fall back to stored URI if needed.
    let imageFile = getExportImageFile(attempt.attemptId);

    if (!imageFile.exists && attempt.imageUri) {
      const storedFile = new File(attempt.imageUri);
      if (storedFile.exists) {
        console.warn(
          `[BAYA Export] Canonical path not found for ${attempt.attemptId}, using stored URI: ${attempt.imageUri}`
        );
        imageFile = storedFile;
      }
    }

    if (__DEV__) {
      console.log('[BAYA Export Image Debug]', {
        attemptId: attempt.attemptId,
        targetClass: attempt.targetClass,
        storedUri: attempt.imageUri,
        canonicalUri: imageFile.uri,
        exists: imageFile.exists,
        size: imageFile.exists ? imageFile.size : 0,
      });
    }

    if (!imageFile.exists) {
      imageFailures.push(
        `class=${attempt.targetClass} id=${attempt.attemptId} uri=${imageFile.uri} — file not found`
      );
      continue;
    }

    try {
      // CORRECT API for expo-file-system v57:
      // File.base64() returns Promise<string> with base64-encoded file content.
      // FileSystem.readAsStringAsync is a DEPRECATED STUB that THROWS at runtime — never use it.
      const b64 = await imageFile.base64();

      if (!b64 || b64.length === 0) {
        throw new Error('base64() returned empty content');
      }

      imagesFolder.file(filename, b64, { base64: true });
      exportAttempts.push(buildExportAttemptRecord(attempt));
    } catch (e: any) {
      const msg = `class=${attempt.targetClass} id=${attempt.attemptId} uri=${imageFile.uri} error=${String(e?.message ?? e)}`;
      console.error('[BAYA Export Image Failure]', msg);
      imageFailures.push(msg);
    }
  }

  // 4. Integrity check — abort if any images failed
  if (imageFailures.length > 0) {
    const preview = imageFailures.slice(0, 3).join('\n');
    throw new Error(
      `Export aborted: ${imageFailures.length} image(s) could not be read:\n${preview}`
    );
  }

  // 5. Add manifest files
  const metadata = buildDatasetMetadata(
    sessionState.attemptIdsByClass,
    exportAttempts.length,
    exportAttempts.length,
    Date.now(),
    exportAttempts.map(attempt => attempt.schemaVersion),
  );

  zip.file('attempts.json', JSON.stringify(exportAttempts, null, 2));
  zip.file('metadata.json', JSON.stringify(metadata, null, 2));

  console.log(`[BAYA Export] Bundling ${exportAttempts.length} attempts (isComplete=${metadata.isComplete})...`);

  // 6. Generate ZIP bytes
  const zipBytes = await zip.generateAsync({ type: 'uint8array' });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const zipFilename = `BAYA_dataset_${timestamp}.zip`;

  // 7. Write ZIP to cache — write() is sync in expo-file-system v57 File API
  const zipFile = new File(Paths.cache, zipFilename);
  zipFile.write(zipBytes);
  console.log(`[BAYA Export] Wrote ZIP to cache: ${zipFile.uri} (${zipBytes.length} bytes)`);

  // 8. Share via expo-sharing
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    try { zipFile.delete(); } catch (e) {}
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(zipFile.uri, {
    mimeType: 'application/zip',
    dialogTitle: 'Export Handwriting Dataset',
  });

  // Clean up temporary ZIP after sharing
  try { zipFile.delete(); } catch (e) {}
  console.log('[BAYA Export] Done — temporary ZIP cleaned up.');
}
