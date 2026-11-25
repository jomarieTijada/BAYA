import { approvedCurriculum } from '../approvedCurriculum';
import { characterActivities, getCharacterSet, type CharacterQuestion } from './index';

export type Concept = 'vowel' | 'base-consonant' | 'upper-kudlit' | 'lower-kudlit';
export function targetGlyph(q: CharacterQuestion, bankNumber: number) {
  if (q.type === 'handwriting') return q.expectedGlyph;
  return bankNumber === 2 ? q.prompt : q.options.find(o => o.letter === q.correctLetter)!.label;
}
export function questionConcept(glyph: string): Concept {
  if (glyph.includes('\u1712')) return 'upper-kudlit';
  if (glyph.includes('\u1713')) return 'lower-kudlit';
  return ['ᜀ', 'ᜁ', 'ᜂ'].includes(glyph) ? 'vowel' : 'base-consonant';
}
const conceptTopics: Record<Concept, string> = { vowel: 'topic-2-1', 'base-consonant': 'topic-2-2', 'upper-kudlit': 'topic-kudlit-upper', 'lower-kudlit': 'topic-kudlit-lower' };
/** References the immutable source objects; bank/set order is preserved within each subset. */
export const questionPlacements = characterActivities.flatMap(activity => activity.sets.flatMap(set => set.questions.map(question => {
  const glyph = targetGlyph(question, activity.number), concept = questionConcept(glyph);
  const topicId = question.type === 'handwriting' ? (concept === 'vowel' ? 'topic-3-1' : 'topic-3-2') : conceptTopics[concept];
  return { questionId: question.id, sourceActivityId: activity.id, sourceSetId: set.id, interaction: activity.number,
    topicId, concept, glyph, question, prerequisiteTopicIds: [...new Set([topicId, conceptTopics[concept]])] };
})));
const titles: Record<string, { en: string; tl: string }> = {
  'topic-2-1': { en: 'Vowel Practice', tl: 'Pagsasanay sa Patinig' },
  'topic-2-2': { en: 'Basic Consonant Practice', tl: 'Pagsasanay sa Batayang Katinig' },
  'topic-kudlit-upper': { en: 'Upper Kudlit Practice', tl: 'Pagsasanay sa Kudlit sa Itaas' },
  'topic-kudlit-lower': { en: 'Lower Kudlit Practice', tl: 'Pagsasanay sa Kudlit sa Ibaba' },
  'topic-3-2': { en: 'Consonant Writing Practice', tl: 'Pagsasanay sa Pagsulat ng Katinig' },
};
export const topicCheckpoints = approvedCurriculum.flatMap(module => module.topics.flatMap(topic => {
  const placements = questionPlacements.filter(p => p.topicId === topic.id);
  if (!placements.length) return [];
  return [{ id: `checkpoint-v1-${topic.id}`, topicId: topic.id, moduleId: module.id, title: titles[topic.id],
    questionIds: placements.map(p => p.questionId), questions: placements.map(p => p.question),
    prerequisiteTopicIds: [...new Set(placements.flatMap(p => p.prerequisiteTopicIds))] }];
}));
export type TopicCheckpoint = typeof topicCheckpoints[number];
export const findCheckpoint = (id: string) => topicCheckpoints.find(c => c.id === id);
/** Compatibility adapter: original sets and new checkpoint sequences share one engine. */
export function getAssessmentSet(id: string) {
  const checkpoint = findCheckpoint(id);
  if (!checkpoint) return getCharacterSet(id);
  const set = { id: checkpoint.id, number: 1, title: checkpoint.title.en, questions: checkpoint.questions };
  return { set, activity: { id: checkpoint.id, number: checkpoint.topicId === 'topic-3-2' ? 4 : 0, title: checkpoint.title.en, sourceInstruction: '', sets: [set] } };
}
