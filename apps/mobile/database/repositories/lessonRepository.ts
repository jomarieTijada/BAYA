/** Read only curriculum rows that match the current approved manifest. */
import { getDatabaseConnection } from '../connection';
import { approvedCurriculum, APPROVED_CONTENT_VERSION_ID } from '../../content/approvedCurriculum';
import type { DatabaseConnection, Lesson, Activity } from '../types';

export const lessonRepository = {
  async getLessons(contentVersionId?: string, dbOverride?: DatabaseConnection): Promise<Lesson[]> {
    if (contentVersionId && contentVersionId !== APPROVED_CONTENT_VERSION_ID) return [];
    const db = dbOverride || (await getDatabaseConnection());
    const rows = await db.getAllAsync<Lesson>(
      `SELECT l.lesson_id, l.content_version_id, l.stage_number, l.title, l.description
       FROM lessons l JOIN content_versions v ON v.content_version_id = l.content_version_id
       WHERE v.content_version_id = ? AND v.validation_status = 'approved' ORDER BY l.stage_number;`,
      [APPROVED_CONTENT_VERSION_ID]
    );
    return approvedCurriculum.flatMap((module, index) => {
      const row = rows.find((item) => item.lesson_id === module.id && item.title === module.title && item.stage_number === index + 1);
      return row ? [{ ...row, description: null }] : [];
    });
  },

  async getLessonById(lessonId: string, dbOverride?: DatabaseConnection): Promise<Lesson | null> {
    return (await this.getLessons(undefined, dbOverride)).find((lesson) => lesson.lesson_id === lessonId) ?? null;
  },

  async getActivitiesByLesson(lessonId: string, dbOverride?: DatabaseConnection): Promise<Activity[]> {
    const module = approvedCurriculum.find((item) => item.id === lessonId);
    if (!module || !(await this.getLessonById(lessonId, dbOverride))) return [];
    const db = dbOverride || (await getDatabaseConnection());
    const rows = await db.getAllAsync<Activity>(
      'SELECT activity_id, lesson_id, activity_type, title, sequence_no FROM activities WHERE lesson_id = ? ORDER BY sequence_no;',
      [lessonId]
    );
    return module.topics.flatMap((topic, index) => {
      const row = rows.find((item) => item.activity_id === topic.id && item.title === topic.title && item.sequence_no === index + 1);
      return row ? [{ ...row, activity_type: module.id === 'module-3' ? 'writing' : 'concept' }] : [];
    });
  },

  async getActivityById(activityId: string, dbOverride?: DatabaseConnection): Promise<Activity | null> {
    const module = approvedCurriculum.find((item) => item.topics.some((topic) => topic.id === activityId));
    if (!module) return null;
    return (await this.getActivitiesByLesson(module.id, dbOverride)).find((activity) => activity.activity_id === activityId) ?? null;
  },
};
