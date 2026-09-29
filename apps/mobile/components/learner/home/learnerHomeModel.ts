import type { Module } from '../../../content/modules/catalog';
import type { Profile } from '../../../database/types';
import { learnerHomeDemo, type LearnerHomeViewModel } from './learnerHomeDemo';

/** Home presentation derived from the same saved curriculum state as Lessons. */
export function buildLearnerHomeModel(
  profile: Profile | null,
  modules: readonly Module[],
  completedToday: number
): LearnerHomeViewModel {
  const remainingTopics = modules.reduce((count, item) => count + item.topics.filter(topic => !topic.completed).length, 0);
  const dailyTarget = Math.min(learnerHomeDemo.dailyGoal.target, completedToday + remainingTopics);
  const module = modules.find(item => item.status === 'current') ?? modules[modules.length - 1];
  if (!module || module.topics.length === 0) {
    return {
      ...learnerHomeDemo,
      learner: { ...learnerHomeDemo.learner, name: profile?.display_name ?? 'Learner' },
      dailyGoal: { completed: completedToday, target: dailyTarget },
    };
  }

  const firstIncomplete = module.topics.findIndex(topic => !topic.completed);
  const isComplete = firstIncomplete < 0;
  const currentIndex = isComplete ? module.topics.length - 1 : firstIncomplete;
  const currentTopic = module.topics[currentIndex];
  const completedCount = module.topics.filter(topic => topic.completed).length;

  return {
    ...learnerHomeDemo,
    learner: { ...learnerHomeDemo.learner, name: profile?.display_name ?? 'Learner' },
    currentLesson: {
      moduleId: module.id,
      topicId: isComplete ? null : currentTopic.id,
      course: module.title,
      title: isComplete ? module.title : currentTopic.title,
      currentStep: isComplete ? module.topics.length : currentIndex + 1,
      totalSteps: module.topics.length,
      status: isComplete ? 'completed' : completedCount > 0 ? 'in_progress' : 'not_started',
      steps: module.topics.map((topic, index) => ({
        id: index + 1,
        status: topic.completed ? 'completed' as const : index === currentIndex ? 'current' as const : 'upcoming' as const,
      })),
    },
    dailyGoal: { completed: completedToday, target: dailyTarget },
  };
}
