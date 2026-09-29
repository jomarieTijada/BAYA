import { getApprovedStorybookActivity } from '../approvedStorybook';
import { getBaybayinCharacterTopic } from '../baybayinCharactersData';
import { getWritingTopic } from '../writingLessonData';
import { approvedCurriculum } from "../approvedCurriculum";
import type { AppIconName } from "../../components/ui/AppIcon";

export type ModuleStatus = "current" | "locked" | "completed";
export type LessonStatus = ModuleStatus;

export type TopicStatus =
  "available" | "locked" | "completed" | "in_progress" | "not_started";
export type ActivityStatus = TopicStatus;

export type ActivityType =
  | "video"
  | "concept"
  | "lesson"
  | "guided lesson"
  | "writing"
  | "practice"
  | "checking"
  | "review"
  | "dashboard"
  | "reading"
  | "quiz";

export interface Topic {
  id: string;
  title: string;
  type: ActivityType;
  status: TopicStatus;
  completed: boolean;
  purpose?: string;
  learningPoints?: readonly string[];
  contentAvailable?: boolean;
  videoSource?: string | null;
  durationText?: string;
}

export interface Module {
  id: string;
  number: number;
  title: string;
  subtitle?: string;
  purpose?: string;
  status: ModuleStatus;
  topics: Topic[];
  ctaLabel?: string;
  icon?: AppIconName;
  activities?: Topic[];
}

export type LessonTopic = Topic;
export type LessonActivity = Topic;
export type Activity = Topic;
export type Lesson = Module;
export type LessonItem = Module;
export type LessonModule = Module;

export interface LessonProgressSummary {
  completedCount: number;
  totalLessons: number;
  completedTopicsCount: number;
  totalTopicsCount: number;
  percentage: number;
}

/** Fresh UI models derived exclusively from the approved curriculum. */
export function createApprovedModules(): Module[] {
  return approvedCurriculum.map((module, moduleIndex) => ({
    id: module.id,
    number: moduleIndex + 1,
    title: module.title,
    status: moduleIndex === 0 ? "current" : "locked",
    icon: "lessons",
    ctaLabel: moduleIndex === 0 ? "Simulan" : undefined,
    topics: module.topics.map((topic, topicIndex) => ({
      ...topic,
      type: module.id === 'module-3' ? "writing" : "concept",
      status: moduleIndex === 0 && topicIndex === 0 ? "available" : "locked",
      completed: false,
      contentAvailable: getApprovedStorybookActivity(topic.id) !== null || getBaybayinCharacterTopic(topic.id) !== null || getWritingTopic(topic.id) !== null,
    })),
    get activities() {
      return this.topics;
    },
  }));
}

// Compatibility aliases contain approved data only, never demo curriculum.
export const defaultModules: readonly Module[] = createApprovedModules();
export const defaultLessons = defaultModules;
export const newLearnerLessons = defaultModules;

/**
 * Calculates overall curriculum progress metrics from the given modules/lessons.
 * Formula: completed topics / total topics across curriculum.
 * Guaranteed to derive values dynamically rather than hardcoding.
 */
export function getLessonProgress(
  lessons: readonly Lesson[],
): LessonProgressSummary {
  const totalLessons = lessons.length;
  if (totalLessons === 0) {
    return {
      completedCount: 0,
      totalLessons: 0,
      completedTopicsCount: 0,
      totalTopicsCount: 0,
      percentage: 0,
    };
  }

  let totalTopics = 0;
  let completedTopics = 0;
  let completedLessons = 0;

  for (const lesson of lessons) {
    if (lesson.status === "completed") {
      completedLessons++;
    }
    const topics = lesson.topics || [];
    totalTopics += topics.length;
    for (const t of topics) {
      if (t.completed) {
        completedTopics++;
      }
    }
  }

  const percentage =
    totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return {
    completedCount: completedLessons,
    totalLessons,
    completedTopicsCount: completedTopics,
    totalTopicsCount: totalTopics,
    percentage,
  };
}
