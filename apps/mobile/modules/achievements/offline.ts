import { Platform } from 'react-native';
import type { DatabaseConnection } from '../../database/types';
import { complete, type SetAttempt } from '../characterActivities/assessment';
import { getAssessmentSet, findCheckpoint } from '../../content/characterActivities/checkpoints';
import { workerMessage, type OfflineState } from '../offline/package';
import { recordAchievementEvent } from './service';

export async function observeOfflineCompletion(attempt: SetAttempt, db: DatabaseConnection) {
  if (!findCheckpoint(attempt.setId) || !complete(attempt) || attempt.cursor !== getAssessmentSet(attempt.setId).set.questions.length) return;
  if (Platform.OS !== 'web' || typeof navigator === 'undefined' || navigator.onLine !== false || !navigator.serviceWorker?.controller) return;
  try {
    const state = await workerMessage<OfflineState>(navigator.serviceWorker.controller, 'BAYA_OFFLINE_STATUS');
    if (state.ready && state.lastVerified && state.version && navigator.onLine === false) await recordAchievementEvent(attempt.profileId, 'offline', attempt.id, db);
  } catch (error) { console.warn('[BAYA achievements] Offline evidence unavailable.', error); }
}
