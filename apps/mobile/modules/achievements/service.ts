import { getReadyDatabase } from '../../database/lifecycle';
import type { DatabaseConnection } from '../../database/types';
import { type SetAttempt, parseAttempt } from '../characterActivities/assessment';
import { evaluateAchievements, type EvidenceEvent } from './evaluate';
import { getBaybayinCharacterTopic } from '../../content/baybayinCharactersData';
import { kudlitVariant } from '../../content/traditionalCharacters';
import { bayaAudio } from '../audio/manifest';

const listeners = new Set<() => void>();
export const subscribeAchievements = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export async function achievementOwner(db: DatabaseConnection) {
  return (await db.getFirstAsync<{ state_value: string }>("SELECT state_value FROM local_app_state WHERE state_key = 'active_learner_profile_id';"))?.state_value;
}
export async function reconcileAchievements(profileId: string, override?: DatabaseConnection, attempt?:SetAttempt) {
  const db = override ?? await getReadyDatabase();
  const topics = await db.getAllAsync<{ activity_id: string }>("SELECT DISTINCT activity_id FROM activity_attempts WHERE learner_profile_id = ? AND result_status = 'completed';", [profileId]);
  const rows = await db.getAllAsync<{ state_value: string }>('SELECT state_value FROM local_app_state WHERE state_key LIKE ?;', [`character_assessment:v1:${profileId}:%`]);
  const events = await db.getAllAsync<EvidenceEvent>('SELECT event_type, entity_id, occurred_at FROM achievement_events WHERE learner_id = ?;', [profileId]);
  const writing = await db.getFirstAsync<{ total: number; valid: number }>(`SELECT COUNT(*) total, COALESCE(SUM(a.result_status = 'valid'),0) valid FROM activity_attempts a JOIN writing_attempts w ON a.attempt_id = w.attempt_id WHERE a.learner_profile_id = ? AND w.scoring_method = 'baya_model_v1' AND a.result_status IN ('valid','invalid');`, [profileId]);
  // Invalid historical records cannot award achievements; preserve them for diagnosis.
  const attempts = rows.flatMap(r => { try { return [parseAttempt(r.state_value, profileId)]; } catch { return []; } });
  const states = evaluateAchievements({ topics: topics.map(t => t.activity_id), attempts, events, writingAttempts: writing?.total ?? 0, writingSuccess: writing?.valid ?? 0 });
  const previous = await db.getAllAsync<{ achievement_id: string }>('SELECT achievement_id FROM learner_achievements WHERE learner_id = ?;', [profileId]);
  const known = new Set(previous.map(r => r.achievement_id));
  for (const state of states) {
    if (known.has(state.definition.id) || state.availability !== 'available' || state.current < state.target) continue;
    await db.runAsync(`INSERT OR IGNORE INTO learner_achievements (learner_id, achievement_id, unlocked_at, definition_version, unlock_source, evidence_reference, notified,reward_amount,reward_attempt_id,reward_checkpoint_id) VALUES (?, ?, ?, ?, 'reconciled', ?, 0,?,?,?);`,
      [profileId, state.definition.id, new Date().toISOString(), state.definition.definitionVersion, JSON.stringify({ condition: state.definition.condition, current: state.current, target: state.target, topicIds: topics.map(t => t.activity_id), assessmentAttemptIds: attempts.map(a => a.id), eventKeys: events.map(e => `${e.event_type}:${e.entity_id}`) }),state.definition.starValue,attempt?.id??null,attempt?.setId??null]);
  }
  const earned = await db.getAllAsync<{ achievement_id: string; unlocked_at: string }>('SELECT achievement_id, unlocked_at FROM learner_achievements WHERE learner_id = ?;', [profileId]);
  const grants = await db.getAllAsync<{source_id:string;amount:number}>("SELECT source_id,amount FROM learner_star_transactions WHERE learner_id=? AND kind='achievement'",[profileId]);
  const amounts = new Map(grants.map(r=>[r.source_id,r.amount]));
  for (const s of states) {
    if(!known.has(s.definition.id)||amounts.has(s.definition.id)||s.availability!=='available'||!s.definition.starValue) continue;
    await db.runAsync("INSERT INTO learner_star_transactions(learner_id,kind,source_id,amount,policy_version) VALUES(?,'achievement',?,?,1) ON CONFLICT(learner_id,kind,source_id) DO NOTHING",[profileId,s.definition.id,s.definition.starValue]);
    amounts.set(s.definition.id,s.definition.starValue);
  }
  return states.map(s => { const unlockedAt = earned.find(r => r.achievement_id === s.definition.id)?.unlocked_at ?? null; return { ...s, grantedStars:amounts.get(s.definition.id), current: unlockedAt ? s.target : s.current, unlockedAt }; });
}
/** Isolate achievement failures from an already successful educational save. */
export async function refreshAchievements(override?: DatabaseConnection, attempt?:SetAttempt) {
  try {
    const db = override ?? await getReadyDatabase(), owner = await achievementOwner(db);
    if (owner) await reconcileAchievements(owner, db, attempt?.profileId===owner?attempt:undefined);
    listeners.forEach(l => l());
  } catch (error) { console.warn('[BAYA achievements] Reconciliation will retry on next visit.', error); }
}
export async function recordAchievementEvent(profileId: string, type: string, entity: string, override?: DatabaseConnection) {
  const db = override ?? await getReadyDatabase();
  if (await achievementOwner(db) !== profileId) return;
  await db.runAsync('INSERT OR IGNORE INTO achievement_events (learner_id, event_type, entity_id, occurred_at) VALUES (?, ?, ?, ?);', [profileId, type, entity, new Date().toISOString()]);
  const assessment = type==='offline'||type==='resume' ? await db.getFirstAsync<{state_value:string}>('SELECT state_value FROM local_app_state WHERE state_key=?',['character_assessment:v1:'+profileId+':'+entity]) : null;
  await refreshAchievements(db, assessment?parseAttempt(assessment.state_value,profileId):undefined);
}
export async function exploreCharacter(topicId: string, characterId: string, profileId: string) {
  const topic = getBaybayinCharacterTopic(topicId);
  if (!topic?.characters.some(c => c.id === characterId)) return;
  const group = topic.kudlit ? `${topic.kudlit}-kudlit` : topic.category === 'patinig' ? 'vowel' : 'base-consonant';
  const id = topic.kudlit ? kudlitVariant(characterId, topic.kudlit).id : characterId;
  await recordAchievementEvent(profileId, `explore:${group}`, id);
}
export async function recordAudioCompletion(profileId: string, id: string) {
  if (bayaAudio.some(a => a.id === id)) await recordAchievementEvent(profileId, 'audio', id);
}
