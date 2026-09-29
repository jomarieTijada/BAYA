/** All learner content is bounded by the approved manifest, including fallbacks. */
import { activityContentService, activityContentFromDatabase } from './activityContentService';
import { getBaybayinCharacterTopic } from '../../content/baybayinCharactersData';
import { getWritingTopic } from '../../content/writingLessonData';
import { lessonRepository } from '../repositories/lessonRepository';
import type { DatabaseConnection } from '../types';
import { createApprovedModules, type Module, type Topic } from '../../content/modules/catalog';
import { getReadyDatabase } from '../lifecycle';
import { applyCompletedTopics, localLearnerService } from './localLearnerService';

export function normalizeLessonId(id: string | number): string {
  const value = String(id).trim();
  return /^\d+$/.test(value) ? `module-${Number(value)}` : value;
}

export const curriculumService = {
  async getCurriculumModules(dbOverride?: DatabaseConnection): Promise<Module[]> {
    const modules = createApprovedModules();
    try {
      const db = dbOverride ?? await getReadyDatabase();
      const lessons = await lessonRepository.getLessons(undefined, db);
      // Repository checks membership, version and exact titles. Missing or stale
      // database content uses the same approved manifest; never merge raw rows.
      for (const module of modules) {
        const row = lessons.find((lesson) => lesson.lesson_id === module.id);
        if (row) {
          module.title = row.title;
          const activities = await lessonRepository.getActivitiesByLesson(module.id, db);
          for (const topic of module.topics) {
            const activity = activities.find((item) => item.activity_id === topic.id);
            if (activity) topic.title = activity.title;
          }
        }
      }
      applyCompletedTopics(modules, await localLearnerService.getCompletedTopicIds(db));
    } catch {
      // SQLite can be unavailable on first launch/offline web. The manifest is
      // independently approved, so it is also the complete safe fallback.
    }
    const content = dbOverride ? activityContentFromDatabase(dbOverride) : activityContentService;
    await Promise.all(modules.flatMap(module => module.topics.map(async topic => {
      topic.contentAvailable = getBaybayinCharacterTopic(topic.id) !== null || getWritingTopic(topic.id) !== null || !!(await content.getByTopicId(topic.id));
    })));
    return modules;
  },

  async getModuleById(lessonId: string | number, dbOverride?: DatabaseConnection): Promise<Module | null> {
    const id = normalizeLessonId(lessonId);
    const modules = await this.getCurriculumModules(dbOverride);
    return modules.find((module) => module.id === id) ?? null;
  },

  async getModuleTopics(lessonId: string | number, dbOverride?: DatabaseConnection): Promise<Topic[]> {
    return (await this.getModuleById(lessonId, dbOverride))?.topics ?? [];
  },

  async getTopicById(topicId: string, dbOverride?: DatabaseConnection): Promise<Topic | null> {
    const modules = await this.getCurriculumModules(dbOverride);
    return modules.flatMap((module) => module.topics).find((topic) => topic.id === topicId) ?? null;
  },
};
