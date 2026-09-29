import { approvedCurriculum } from '../../../content/approvedCurriculum';

export type LessonStepStatus = 'completed' | 'current' | 'upcoming';
export type LessonProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface LearnerHomeViewModel {
  learner: {
    name: string;
    mode: string;
    title: string;
    xp: number;
    xpGoal: number;
    level: number;
  };
  currentLesson: {
    moduleId: string;
    topicId: string | null;
    course: string;
    title: string;
    currentStep: number;
    totalSteps: number;
    status?: LessonProgressStatus;
    steps: readonly {
      id: number;
      status: LessonStepStatus;
    }[];
  };
  dailyGoal: {
    completed: number;
    target: number;
  };
  adventure: {
    title: string;
    description: string;
  };
  recentAchievement: {
    title: string;
    description: string;
  } | null;
}

/** Frontend-only presentation fixture. It is not a persistence or domain model. */
export const learnerHomeDemo: LearnerHomeViewModel = {
  learner: {
    name: 'Learner',
    mode: 'Independent Learner',
    title: 'Baybayin Learner',
    xp: 0,
    xpGoal: 20,
    level: 1,
  },
  currentLesson: {
    moduleId: approvedCurriculum[0].id,
    topicId: approvedCurriculum[0].topics[0].id,
    course: approvedCurriculum[0].title,
    title: approvedCurriculum[0].topics[0].title,
    currentStep: 1,
    totalSteps: approvedCurriculum[0].topics.length,
    status: 'not_started',
    steps: approvedCurriculum[0].topics.map((_, index) => ({
      id: index + 1,
      status: index === 0 ? 'current' : 'upcoming',
    })),
  },
  dailyGoal: {
    completed: 0,
    target: 3,
  },
  adventure: {
    title: 'Adventures Locked',
    description: 'Complete Baybayin Basics to unlock values stories.',
  },
  recentAchievement: null,
};
