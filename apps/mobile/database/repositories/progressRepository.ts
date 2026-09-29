/**
 * apps/mobile/database/repositories/progressRepository.ts
 *
 * Repository for Learner Progress, Activity Attempts, and Review Items.
 * Parameterized queries only.
 */

import { getDatabaseConnection } from '../connection';
import type {
  DatabaseConnection,
  LearnerProgress,
  ActivityAttempt,
  ReviewItem,
  ProgressStatus,
  AttemptResultStatus,
  ReviewItemStatus,
} from '../types';

export interface CreateProgressInput {
  learner_progress_id: string;
  learner_profile_id: string;
  lesson_id: string;
  status: ProgressStatus | string;
  completed_at?: string | null;
  last_activity_at?: string | null;
  updated_at?: string;
}

export interface UpdateProgressInput {
  status?: ProgressStatus | string;
  completed_at?: string | null;
  last_activity_at?: string | null;
}

export interface RecordAttemptInput {
  attempt_id: string;
  learner_profile_id: string;
  activity_id: string;
  result_status: AttemptResultStatus | string;
  recognized_result?: string | null;
  confidence_value?: number | null;
  feedback_code?: string | null;
  attempted_at?: string;
}

export interface CreateReviewItemInput {
  review_item_id: string;
  learner_profile_id: string;
  activity_id: string;
  reason: string;
  status: ReviewItemStatus | string;
  created_at?: string;
  resolved_at?: string | null;
}

export const progressRepository = {
  /**
   * Create an initial progress entry for a learner and lesson.
   */
  async createProgress(
    input: CreateProgressInput,
    dbOverride?: DatabaseConnection
  ): Promise<LearnerProgress> {
    const db = dbOverride || (await getDatabaseConnection());
    const nowIso = new Date().toISOString();
    const updatedAt = input.updated_at || nowIso;
    const completedAt = input.completed_at || null;
    const lastActivityAt = input.last_activity_at || null;

    await db.runAsync(
      `INSERT INTO learner_progress (
        learner_progress_id, learner_profile_id, lesson_id, status, completed_at, last_activity_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        input.learner_progress_id,
        input.learner_profile_id,
        input.lesson_id,
        input.status,
        completedAt,
        lastActivityAt,
        updatedAt,
      ]
    );

    return {
      learner_progress_id: input.learner_progress_id,
      learner_profile_id: input.learner_profile_id,
      lesson_id: input.lesson_id,
      status: input.status,
      completed_at: completedAt,
      last_activity_at: lastActivityAt,
      updated_at: updatedAt,
    };
  },

  /**
   * Update an existing progress record.
   */
  async updateProgress(
    progressId: string,
    updates: UpdateProgressInput,
    dbOverride?: DatabaseConnection
  ): Promise<LearnerProgress | null> {
    const db = dbOverride || (await getDatabaseConnection());
    const existing = await db.getFirstAsync<LearnerProgress>(
      'SELECT learner_progress_id, learner_profile_id, lesson_id, status, completed_at, last_activity_at, updated_at FROM learner_progress WHERE learner_progress_id = ?;',
      [progressId]
    );

    if (!existing) {
      return null;
    }

    const updatedAt = new Date().toISOString();
    const status = updates.status !== undefined ? updates.status : existing.status;
    const completedAt = updates.completed_at !== undefined ? updates.completed_at : existing.completed_at;
    const lastActivityAt = updates.last_activity_at !== undefined ? updates.last_activity_at : existing.last_activity_at;

    await db.runAsync(
      `UPDATE learner_progress
       SET status = ?, completed_at = ?, last_activity_at = ?, updated_at = ?
       WHERE learner_progress_id = ?;`,
      [status, completedAt, lastActivityAt, updatedAt, progressId]
    );

    return {
      ...existing,
      status,
      completed_at: completedAt,
      last_activity_at: lastActivityAt,
      updated_at: updatedAt,
    };
  },

  /**
   * Retrieve all progress records for a learner.
   */
  async getLearnerProgress(
    learnerProfileId: string,
    dbOverride?: DatabaseConnection
  ): Promise<LearnerProgress[]> {
    const db = dbOverride || (await getDatabaseConnection());
    return db.getAllAsync<LearnerProgress>(
      'SELECT learner_progress_id, learner_profile_id, lesson_id, status, completed_at, last_activity_at, updated_at FROM learner_progress WHERE learner_profile_id = ?;',
      [learnerProfileId]
    );
  },

  /**
   * Retrieve progress for a specific lesson and learner.
   */
  async getLessonProgress(
    learnerProfileId: string,
    lessonId: string,
    dbOverride?: DatabaseConnection
  ): Promise<LearnerProgress | null> {
    const db = dbOverride || (await getDatabaseConnection());
    return db.getFirstAsync<LearnerProgress>(
      'SELECT learner_progress_id, learner_profile_id, lesson_id, status, completed_at, last_activity_at, updated_at FROM learner_progress WHERE learner_profile_id = ? AND lesson_id = ?;',
      [learnerProfileId, lessonId]
    );
  },

  /**
   * Record a learner attempt on an activity (e.g. handwriting recognition).
   */
  async recordAttempt(
    input: RecordAttemptInput,
    dbOverride?: DatabaseConnection
  ): Promise<ActivityAttempt> {
    const db = dbOverride || (await getDatabaseConnection());
    const attemptedAt = input.attempted_at || new Date().toISOString();
    const recognizedResult = input.recognized_result || null;
    const confidenceValue = input.confidence_value !== undefined ? input.confidence_value : null;
    const feedbackCode = input.feedback_code || null;

    await db.runAsync(
      `INSERT INTO activity_attempts (
        attempt_id, learner_profile_id, activity_id, result_status, recognized_result, confidence_value, feedback_code, attempted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        input.attempt_id,
        input.learner_profile_id,
        input.activity_id,
        input.result_status,
        recognizedResult,
        confidenceValue,
        feedbackCode,
        attemptedAt,
      ]
    );

    return {
      attempt_id: input.attempt_id,
      learner_profile_id: input.learner_profile_id,
      activity_id: input.activity_id,
      result_status: input.result_status,
      recognized_result: recognizedResult,
      confidence_value: confidenceValue,
      feedback_code: feedbackCode,
      attempted_at: attemptedAt,
    };
  },

  /**
   * Get all attempts for a given activity by a learner.
   */
  async getAttemptsByActivity(
    learnerProfileId: string,
    activityId: string,
    dbOverride?: DatabaseConnection
  ): Promise<ActivityAttempt[]> {
    const db = dbOverride || (await getDatabaseConnection());
    return db.getAllAsync<ActivityAttempt>(
      'SELECT attempt_id, learner_profile_id, activity_id, result_status, recognized_result, confidence_value, feedback_code, attempted_at FROM activity_attempts WHERE learner_profile_id = ? AND activity_id = ? ORDER BY attempted_at DESC;',
      [learnerProfileId, activityId]
    );
  },

  /**
   * Create a review item for spaced repetition or mistake tracking.
   */
  async createReviewItem(
    input: CreateReviewItemInput,
    dbOverride?: DatabaseConnection
  ): Promise<ReviewItem> {
    const db = dbOverride || (await getDatabaseConnection());
    const createdAt = input.created_at || new Date().toISOString();
    const resolvedAt = input.resolved_at || null;

    await db.runAsync(
      `INSERT INTO review_items (
        review_item_id, learner_profile_id, activity_id, reason, status, created_at, resolved_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        input.review_item_id,
        input.learner_profile_id,
        input.activity_id,
        input.reason,
        input.status,
        createdAt,
        resolvedAt,
      ]
    );

    return {
      review_item_id: input.review_item_id,
      learner_profile_id: input.learner_profile_id,
      activity_id: input.activity_id,
      reason: input.reason,
      status: input.status,
      created_at: createdAt,
      resolved_at: resolvedAt,
    };
  },

  /**
   * Retrieve review items for a learner, optionally filtered by status.
   */
  async getReviewItems(
    learnerProfileId: string,
    status?: string,
    dbOverride?: DatabaseConnection
  ): Promise<ReviewItem[]> {
    const db = dbOverride || (await getDatabaseConnection());
    if (status) {
      return db.getAllAsync<ReviewItem>(
        'SELECT review_item_id, learner_profile_id, activity_id, reason, status, created_at, resolved_at FROM review_items WHERE learner_profile_id = ? AND status = ? ORDER BY created_at DESC;',
        [learnerProfileId, status]
      );
    }
    return db.getAllAsync<ReviewItem>(
      'SELECT review_item_id, learner_profile_id, activity_id, reason, status, created_at, resolved_at FROM review_items WHERE learner_profile_id = ? ORDER BY created_at DESC;',
      [learnerProfileId]
    );
  },
};
