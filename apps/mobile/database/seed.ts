import { getApprovedStorybookActivities } from '../content/approvedStorybook';
/** SQLite seed derived only from the validator-approved curriculum. */
import { approvedCurriculum, APPROVED_CONTENT_VERSION_ID } from '../content/approvedCurriculum';
import type { DatabaseConnection, ContentVersion, Lesson, Activity } from './types';

export const SEED_CONTENT_VERSION: ContentVersion = {
  content_version_id: APPROVED_CONTENT_VERSION_ID,
  version_label: 'BAYA Modules 1 to 3',
  validation_status: 'approved',
  activated_at: null,
};

export const SEED_LESSONS: readonly Lesson[] = approvedCurriculum.map((module, index) => ({
  lesson_id: module.id,
  content_version_id: APPROVED_CONTENT_VERSION_ID,
  stage_number: index + 1,
  title: module.title,
  description: null,
}));

export const SEED_ACTIVITIES: readonly Activity[] = approvedCurriculum.flatMap((module) =>
  module.topics.map((topic, index) => ({
    activity_id: topic.id,
    lesson_id: module.id,
    activity_type: module.id === 'module-3' ? 'writing' : 'concept',
    title: topic.title,
    sequence_no: index + 1,
  }))
);

export interface SeedResult {
  contentVersionInserted: boolean;
  lessonsInsertedCount: number;
  activitiesInsertedCount: number;
}

/**
 * Reconciles old installations as well as fresh databases in one transaction.
 * Legacy rows are retained to preserve learner history. Repositories exclude
 * them using the approved manifest and version, even if marked approved before.
 */
export async function seedCurriculum(db: DatabaseConnection): Promise<SeedResult> {
  if (!db.withTransactionAsync) throw new Error('Curriculum seed requires a transactional database connection.');
  return db.withTransactionAsync(async (transactionDb) => {
    const result: SeedResult = {
      contentVersionInserted: false, lessonsInsertedCount: 0, activitiesInsertedCount: 0,
    };
    await transactionDb.runAsync(
      'UPDATE content_versions SET validation_status = ? WHERE content_version_id IN (?, ?, ?, ?);',
      ['deprecated', 'version-baya-basics-v1', 'version-baya-validated-module-1-v1', 'version-baya-validated-module-1-v2', 'version-baya-modules-1-and-2-v1']
    );
    const version = await transactionDb.runAsync(
      `INSERT OR IGNORE INTO content_versions
       (content_version_id, version_label, validation_status, activated_at) VALUES (?, ?, ?, ?);`,
      [APPROVED_CONTENT_VERSION_ID, SEED_CONTENT_VERSION.version_label, 'approved', null]
    );
    result.contentVersionInserted = version.changes > 0;

    for (const lesson of SEED_LESSONS) {
      const existing = await transactionDb.getFirstAsync('SELECT lesson_id FROM lessons WHERE lesson_id = ?;', [lesson.lesson_id]);
      await transactionDb.runAsync(
        `INSERT INTO lessons (lesson_id, content_version_id, stage_number, title, description)
         VALUES (?, ?, ?, ?, ?) ON CONFLICT(lesson_id) DO UPDATE SET
         content_version_id = excluded.content_version_id, stage_number = excluded.stage_number,
         title = excluded.title, description = excluded.description;`,
        [lesson.lesson_id, lesson.content_version_id, lesson.stage_number, lesson.title, null]
      );
      if (!existing) result.lessonsInsertedCount++;
    }
    for (const activity of SEED_ACTIVITIES) {
      const existing = await transactionDb.getFirstAsync('SELECT activity_id FROM activities WHERE activity_id = ?;', [activity.activity_id]);
      await transactionDb.runAsync(
        `INSERT INTO activities (activity_id, lesson_id, activity_type, title, sequence_no)
         VALUES (?, ?, ?, ?, ?) ON CONFLICT(activity_id) DO UPDATE SET
         lesson_id = excluded.lesson_id, activity_type = excluded.activity_type,
         title = excluded.title, sequence_no = excluded.sequence_no;`,
        [activity.activity_id, activity.lesson_id, activity.activity_type, activity.title, activity.sequence_no]
      );
      if (!existing) result.activitiesInsertedCount++;
    }
    // Record the source supplied in the recovery request; do not present these as
    // independently authenticated validator credentials.
    for (const activity of getApprovedStorybookActivities()) {
      await transactionDb.runAsync(
        `INSERT INTO activity_content (activity_id, revision, validation_status, reviewed_by, reviewed_at, payload_json)
         VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(activity_id) DO UPDATE SET
         revision = excluded.revision, validation_status = excluded.validation_status,
         reviewed_by = excluded.reviewed_by, reviewed_at = excluded.reviewed_at,
         payload_json = excluded.payload_json;`,
        [activity.id, 1, 'approved', 'user-supplied-approved-curriculum-recovery', '2026-09-26T00:00:00.000Z', JSON.stringify(activity)]
      );
    }
    return result;
  });
}
