import { createApprovedModules } from '../../../content/modules/catalog';
import { characterActivities, questionRecording, glyphAsset } from '../../../content/characterActivities';
import { topicCheckpoints, questionPlacements, getAssessmentSet } from '../../../content/characterActivities/checkpoints';
import { checkpointEligibility, checkpointEligibilityFromIds, nextInstructionAfter } from '../curriculum';

test('all 100 immutable questions have one topic owner and retain deterministic source order', () => {
  const source = characterActivities.flatMap(a => a.sets.flatMap(s => s.questions));
  expect(source).toHaveLength(100);
  expect(questionPlacements.map(p => p.question)).toEqual(source);
  expect(new Set(topicCheckpoints.flatMap(c => c.questionIds)).size).toBe(100);
  expect(topicCheckpoints.reduce((n,c) => n+c.questions.length,0)).toBe(100);
  expect(topicCheckpoints.map(c => [c.topicId,c.questions.length])).toEqual([
    ['topic-2-1',3],['topic-2-2',22],['topic-kudlit-upper',27],['topic-kudlit-lower',23],['topic-3-2',25],
  ]);
  for (const c of topicCheckpoints) for (const q of c.questions) expect(q).toBe(source.find(s => s.id === q.id));
  for (const a of characterActivities) for (const s of a.sets) expect(getAssessmentSet(s.id).set).toBe(s);
});
test('placements reflect actual target glyphs and writing concepts, with valid illustrations', () => {
  for (const p of questionPlacements) {
    expect(glyphAsset(p.glyph)).toBeTruthy();
    const instruction = p.glyph.includes('ᜒ') ? 'topic-kudlit-upper' : p.glyph.includes('ᜓ') ? 'topic-kudlit-lower' : ['ᜀ','ᜁ','ᜂ'].includes(p.glyph) ? 'topic-2-1' : 'topic-2-2';
    expect(p.prerequisiteTopicIds).toContain(instruction);
    expect(p.topicId).toBe(p.interaction === 4 ? 'topic-3-2' : instruction);
  }
  expect(questionPlacements.filter(p => p.interaction === 1 && !questionRecording(p.question)).map(p => p.question.prompt)).toEqual(['DE','RE']);
});
test.each(topicCheckpoints)('$id unlocks immediately after its own instruction, without requiring later topics or a score', c => {
  const modules = createApprovedModules(), topics = modules.flatMap(m => m.topics);
  modules.forEach(m => { m.status='completed'; });
  expect(checkpointEligibility(c.id,modules).eligible).toBe(false);
  const index = topics.findIndex(t => t.id === c.topicId);
  topics.slice(0,index).forEach(t => { t.completed=true; });
  expect(checkpointEligibility(c.id,modules).missingTopicIds).toEqual([c.topicId]);
  topics[index].completed=true;
  expect(checkpointEligibility(c.id,modules).eligible).toBe(true);
  topics[0].completed=false;
  expect(checkpointEligibility(c.id,modules).eligible).toBe(false);
});
test('unknown and removed bank identities fail closed in the topic resolver', () => {
  for (const id of ['unknown','character-1','character-4']) expect(checkpointEligibilityFromIds(id,new Set()).eligible).toBe(false);
});

test('checkpoint Next follows curriculum order across modules without bypassing locked instruction', () => {
 const modules=createApprovedModules();
 modules.forEach(m=>m.topics.forEach(t=>{t.status='available';t.contentAvailable=true;}));
 for(const [from,to] of [['topic-2-1','topic-2-2'],['topic-2-2','topic-kudlit-upper'],['topic-kudlit-upper','topic-kudlit-lower'],['topic-kudlit-lower','topic-3-1']]) expect(nextInstructionAfter(from,modules)?.id).toBe(to);
 expect(nextInstructionAfter('topic-3-2',modules)).toBeUndefined();
 expect(nextInstructionAfter('unknown',modules)).toBeUndefined();
 modules[1].topics[1].status='locked';
 expect(nextInstructionAfter('topic-2-1',modules)).toBeUndefined();
});
