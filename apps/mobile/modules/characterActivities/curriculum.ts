import { approvedCurriculum } from '../../content/approvedCurriculum';
import type { Module } from '../../content/modules/catalog';
import { findCheckpoint } from '../../content/characterActivities/checkpoints';

/** Topic prerequisite plus existing ordered instructional prerequisites, never later topics. */
export function checkpointEligibilityFromIds(id: string, completed: ReadonlySet<string>) {
  const checkpoint = findCheckpoint(id);
  const topics = approvedCurriculum.flatMap(m => m.topics);
  const required = new Set<string>();
  for (const prerequisite of checkpoint?.prerequisiteTopicIds ?? []) {
    const index = topics.findIndex(t => t.id === prerequisite);
    topics.slice(0, index + 1).forEach(t => required.add(t.id));
  }
  const missingTopicIds = [...required].filter(topic => !completed.has(topic));
  return { eligible: !!checkpoint && missingTopicIds.length === 0, missingTopicIds };
}
export function checkpointEligibility(id: string, modules: readonly Module[]) {
  return checkpointEligibilityFromIds(id, new Set(modules.flatMap(m => m.topics.filter(t => t.completed).map(t => t.id))));
}


/** Continue in curriculum order, using the existing instructional unlock policy. */
export function nextInstructionAfter(topicId: string, modules: readonly Module[]) {
  const topics = modules.flatMap(m => m.topics);
  const index = topics.findIndex(t => t.id === topicId);
  const next = index >= 0 ? topics[index + 1] : undefined;
  return next && next.contentAvailable && next.status !== 'locked' ? next : undefined;
}
