import type { TopicActivityData } from "./types";
import { unavailableActivity } from "./activitySteps";
import { topic11ActivityData } from "./topics/topic-1-1";
import { topic12ActivityData } from "./topics/topic-1-2";
import {
  topic13ActivityData,
  topic14ActivityData,
  topic15ActivityData,
} from "./topics/topic-1-3";
export * from "./types";
export * from "./topics/topic-1-1";
export * from "./topics/topic-1-2";
export * from "./topics/topic-1-3";

/**
 * Registry mapping topic IDs to their activity configurations.
 * Supports future activities (Quiz, Writing, Practice, etc.) without redesigning the screen.
 */
export const activityRegistry: Record<string, TopicActivityData> = {
  "topic-1-1": topic11ActivityData,
  "topic-1-2": topic12ActivityData,
  "topic-1-3": topic13ActivityData,
  "topic-1-4": topic14ActivityData,
  "topic-1-5": topic15ActivityData,
};

/**
 * Retrieves activity data for a given topic ID, returning an explicit empty topic if not yet registered.
 */
export function getActivityData(topicId: string): TopicActivityData {
  return Object.hasOwn(activityRegistry, topicId)
    ? activityRegistry[topicId]
    : unavailableActivity(topicId);
}

export { getActivitySteps, unavailableActivity } from "./activitySteps";
