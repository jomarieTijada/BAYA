import { traditionalGroupForClass, traditionalGroupForSyllable } from '../../content/traditionalCharacters';
import { bayaAudio } from './manifest';

/** Found in the original archive and decoded/transcribed locally. Machine transcription
 * is not listening approval. These candidates cannot silently enter a scored question.
 * Once the validator confirms a clip, add its optimized entry to the manifest and update
 * this explicit status; all consumers below will resolve it through the same mapping.
 */
export const combinedRecordingReview = Object.freeze([
  { id: 'baya-a-dara', source: 'a/DaRa.m4a', spokenGroup: ['da', 'ra'], status: 'integrated' },
  { id: 'baya-e-dere', source: 'e/DeRe.m4a', spokenGroup: ['de', 're'], status: 'integrated' },
  { id: 'baya-i-diri', source: 'i/DiRi.m4a', spokenGroup: ['di', 'ri'], status: 'integrated' },
  { id: 'baya-o-doro', source: 'o/DoRo.m4a', spokenGroup: ['do', 'ro'], status: 'needs-listening-validation' },
  { id: 'baya-u-duru', source: 'u/DuRu.m4a', spokenGroup: ['du', 'ru'], status: 'needs-listening-validation' },
] as const);
export function resolvePronunciation(syllable: string, allowCombined = false) {
  const normalized = syllable.toLowerCase();
  const exact = bayaAudio.find(a => a.syllableId === normalized)
    ?? bayaAudio.find(a => a.category === 'character' && a.label.toLowerCase() === normalized);
  if (exact) return { entry: exact, mode: 'specific' as const, group: traditionalGroupForSyllable(normalized) };
  const group = traditionalGroupForSyllable(normalized);
  const candidate = combinedRecordingReview.find(c => (c.spokenGroup as readonly string[]).includes(normalized));
  const combined = allowCombined && candidate?.status === 'integrated' ? bayaAudio.find(a => a.id === candidate.id) : undefined;
  return { entry: combined, mode: combined ? 'combined' as const : 'unavailable' as const, group, candidate };
}
export function characterPronunciation(characterId: string) {
  const group = traditionalGroupForClass(characterId);
  return bayaAudio.find(a => a.category === 'character' && a.characterId === characterId)
    ?? (group ? bayaAudio.find(a => (group.recordings as readonly string[]).includes(a.id)) : undefined);
}
export function characterVariantRecordings(characterId: string) {
  return bayaAudio.filter(entry => entry.category === 'syllable' && entry.baseCharacterId === characterId);
}
