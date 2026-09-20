/**
 * packages/db/src/schema.sqlite.ts
 *
 * Drizzle ORM schema for the Baya SQLite database.
 * Faithfully translates the ERD — column names, types, PKs, and FKs
 * are kept 1-to-1 so the schema migrates cleanly to PostgreSQL later.
 *
 * Architectural note (Principle 3 — Scalability):
 *   - All FK references use `.references()` — Drizzle emits the correct
 *     REFERENCES clause for SQLite WAL mode and future PG migrations.
 *   - `real` ERD columns map to Drizzle `real()`.
 *   - `integer` boolean flags (has_kudlit, audio_enabled, is_correct…)
 *     use `integer()` with a $type cast so callers get type safety
 *     without a separate boolean column (SQLite has no BOOLEAN type).
 */

import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { HANDWRITING_SCHEMA_VERSION } from "@baya/shared-types";

// ---------------------------------------------------------------------------
// BAYBAYIN_CHARACTERS
// ---------------------------------------------------------------------------
export const baybayinCharacters = sqliteTable("baybayin_characters", {
  id:             text("id").primaryKey(),
  glyph:          text("glyph").notNull(),
  transliteration:text("transliteration").notNull(),
  audioAssetKey:  text("audio_asset_key").notNull().default(""),
});

// ---------------------------------------------------------------------------
// LEARNER_PROFILE
// ---------------------------------------------------------------------------
export const learnerProfile = sqliteTable("learner_profile", {
  id:             integer("id").primaryKey({ autoIncrement: true }),
  nickname:       text("nickname").notNull().default(""),
  avatarId:       text("avatar_id").notNull().default(""),
  totalXp:        integer("total_xp").notNull().default(0),
  currentStreak:  integer("current_streak").notNull().default(0),
  lastActiveDate: text("last_active_date"),              // ISO-8601 date string
  audioEnabled:   integer("audio_enabled")               // 0 | 1 boolean flag
                    .$type<0 | 1>()
                    .notNull()
                    .default(1),
});

// ---------------------------------------------------------------------------
// RANK_THRESHOLDS
// ---------------------------------------------------------------------------
export const rankThresholds = sqliteTable("rank_thresholds", {
  levelId:        integer("level_id").primaryKey({ autoIncrement: true }),
  rankTitle:      text("rank_title").notNull(),
  minXpRequired:  integer("min_xp_required").notNull().default(0),
});

// ---------------------------------------------------------------------------
// LEARNING_MODULES
// ---------------------------------------------------------------------------
export const learningModules = sqliteTable("learning_modules", {
  id:          text("id").primaryKey(),
  stageOrder:  integer("stage_order").notNull().default(0),
  stageType:   text("stage_type").notNull().default(""),
  valueFocus:  text("value_focus").notNull().default(""),
  title:       text("title").notNull(),
});

// ---------------------------------------------------------------------------
// LESSONS
// ---------------------------------------------------------------------------
export const lessons = sqliteTable("lessons", {
  id:          text("id").primaryKey(),
  moduleId:    text("module_id")
                 .notNull()
                 .references(() => learningModules.id, { onDelete: "cascade" }),
  characterId: text("character_id")
                 .notNull()
                 .references(() => baybayinCharacters.id, { onDelete: "restrict" }),
  orderIndex:  integer("order_index").notNull().default(0),
});

// ---------------------------------------------------------------------------
// LESSON_ACTIVITIES
// ---------------------------------------------------------------------------
export const lessonActivities = sqliteTable("lesson_activities", {
  id:           text("id").primaryKey(),
  lessonId:     text("lesson_id")
                  .notNull()
                  .references(() => lessons.id, { onDelete: "cascade" }),
  activityType: text("activity_type").notNull(),   // "practice" | "quiz" | "recognition"
  baseXpReward: integer("base_xp_reward").notNull().default(0),
});

// ---------------------------------------------------------------------------
// ACTIVITY_PRACTICE_CONFIGS  (one-to-one with lessonActivities — PK is also FK)
// ---------------------------------------------------------------------------
export const activityPracticeConfigs = sqliteTable("activity_practice_configs", {
  activityId:          text("activity_id")
                         .primaryKey()
                         .references(() => lessonActivities.id, { onDelete: "cascade" }),
  referenceVectorStr:  text("reference_vector_str").notNull().default(""),
  hasKudlit:           integer("has_kudlit").$type<0 | 1>().notNull().default(0),
  strokeCount:         integer("stroke_count").notNull().default(1),
});

// ---------------------------------------------------------------------------
// ACTIVITY_QUIZ_OPTIONS
// ---------------------------------------------------------------------------
export const activityQuizOptions = sqliteTable("activity_quiz_options", {
  id:         integer("id").primaryKey({ autoIncrement: true }),
  activityId: text("activity_id")
                .notNull()
                .references(() => lessonActivities.id, { onDelete: "cascade" }),
  optionText: text("option_text").notNull(),
  isCorrect:  integer("is_correct").$type<0 | 1>().notNull().default(0),
});

// ---------------------------------------------------------------------------
// LEARNER_ACTIVITY_SUMMARY
// ---------------------------------------------------------------------------
export const learnerActivitySummary = sqliteTable("learner_activity_summary", {
  id:            integer("id").primaryKey({ autoIncrement: true }),
  learnerId:     integer("learner_id")
                   .notNull()
                   .references(() => learnerProfile.id, { onDelete: "cascade" }),
  activityId:    text("activity_id")
                   .notNull()
                   .references(() => lessonActivities.id, { onDelete: "cascade" }),
  isCleared:     integer("is_cleared").$type<0 | 1>().notNull().default(0),
  highScoreXp:   integer("high_score_xp").notNull().default(0),
  timesAttempted:integer("times_attempted").notNull().default(0),
});

// ---------------------------------------------------------------------------
// ACTIVITY_ATTEMPTS_LOG
// ---------------------------------------------------------------------------
export const activityAttemptsLog = sqliteTable("activity_attempts_log", {
  id:              integer("id").primaryKey({ autoIncrement: true }),
  learnerId:       integer("learner_id")
                     .notNull()
                     .references(() => learnerProfile.id, { onDelete: "cascade" }),
  activityId:      text("activity_id")
                     .notNull()
                     .references(() => lessonActivities.id, { onDelete: "cascade" }),
  xpAwarded:       integer("xp_awarded").notNull().default(0),
  visualAccuracy:  real("visual_accuracy"),
  sequenceAccuracy:real("sequence_accuracy"),
  kudlitAccuracy:  integer("kudlit_accuracy"),
  errorCategory:   text("error_category").notNull().default(""),
  inferenceTimeMs: real("inference_time_ms"),
  timestamp:       text("timestamp").notNull(),   // ISO-8601 datetime string
});

// ---------------------------------------------------------------------------
// ACHIEVEMENTS
// ---------------------------------------------------------------------------
export const achievements = sqliteTable("achievements", {
  id:           text("id").primaryKey(),
  badgeKey:     text("badge_key").notNull(),
  title:        text("title").notNull(),
  description:  text("description").notNull().default(""),
  iconAssetKey: text("icon_asset_key").notNull().default(""),
  xpThreshold:  integer("xp_threshold").notNull().default(0),
});

// ---------------------------------------------------------------------------
// LEARNER_ACHIEVEMENTS
// ---------------------------------------------------------------------------
export const learnerAchievements = sqliteTable("learner_achievements", {
  id:            integer("id").primaryKey({ autoIncrement: true }),
  learnerId:     integer("learner_id")
                   .notNull()
                   .references(() => learnerProfile.id, { onDelete: "cascade" }),
  achievementId: text("achievement_id")
                   .notNull()
                   .references(() => achievements.id, { onDelete: "cascade" }),
  unlockedAt:    text("unlocked_at").notNull(),   // ISO-8601 datetime string
});

// ---------------------------------------------------------------------------
// ASSISTANT_DIALOGUES
// ---------------------------------------------------------------------------
export const assistantDialogues = sqliteTable("assistant_dialogues", {
  id:             text("id").primaryKey(),
  triggerRuleKey: text("trigger_rule_key").notNull(),
  contextStage:   text("context_stage").notNull().default(""),
  dialogueText:   text("dialogue_text").notNull(),
  assistantMood:  text("assistant_mood").notNull().default(""),
});

// ---------------------------------------------------------------------------
// ASSISTANT_INTERACTIONS
// ---------------------------------------------------------------------------
export const assistantInteractions = sqliteTable("assistant_interactions", {
  id:             integer("id").primaryKey({ autoIncrement: true }),
  learnerId:      integer("learner_id")
                    .notNull()
                    .references(() => learnerProfile.id, { onDelete: "cascade" }),
  dialogueShownId:text("dialogue_shown_id")
                    .notNull()
                    .references(() => assistantDialogues.id, { onDelete: "restrict" }),
  wasHelpful:     integer("was_helpful").$type<0 | 1 | null>(),
  timestamp:      text("timestamp").notNull(),   // ISO-8601 datetime string
});

// ===========================================================================
// RELATIONS  (used by Drizzle's relational query API)
// ===========================================================================

export const baybayinCharactersRelations = relations(baybayinCharacters, ({ many }) => ({
  lessons: many(lessons),
}));

export const learningModulesRelations = relations(learningModules, ({ many }) => ({
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  module:     one(learningModules, { fields: [lessons.moduleId],    references: [learningModules.id] }),
  character:  one(baybayinCharacters, { fields: [lessons.characterId], references: [baybayinCharacters.id] }),
  activities: many(lessonActivities),
}));

export const lessonActivitiesRelations = relations(lessonActivities, ({ one, many }) => ({
  lesson:          one(lessons, { fields: [lessonActivities.lessonId], references: [lessons.id] }),
  practiceConfig:  one(activityPracticeConfigs, { fields: [lessonActivities.id], references: [activityPracticeConfigs.activityId] }),
  quizOptions:     many(activityQuizOptions),
  summaries:       many(learnerActivitySummary),
  attemptsLog:     many(activityAttemptsLog),
}));

export const activityPracticeConfigsRelations = relations(activityPracticeConfigs, ({ one }) => ({
  activity: one(lessonActivities, { fields: [activityPracticeConfigs.activityId], references: [lessonActivities.id] }),
}));

export const activityQuizOptionsRelations = relations(activityQuizOptions, ({ one }) => ({
  activity: one(lessonActivities, { fields: [activityQuizOptions.activityId], references: [lessonActivities.id] }),
}));

export const learnerProfileRelations = relations(learnerProfile, ({ many }) => ({
  activitySummaries:    many(learnerActivitySummary),
  attemptsLog:          many(activityAttemptsLog),
  achievements:         many(learnerAchievements),
  assistantInteractions:many(assistantInteractions),
}));

export const learnerActivitySummaryRelations = relations(learnerActivitySummary, ({ one }) => ({
  learner:  one(learnerProfile,   { fields: [learnerActivitySummary.learnerId],  references: [learnerProfile.id] }),
  activity: one(lessonActivities, { fields: [learnerActivitySummary.activityId], references: [lessonActivities.id] }),
}));

export const activityAttemptsLogRelations = relations(activityAttemptsLog, ({ one }) => ({
  learner:  one(learnerProfile,   { fields: [activityAttemptsLog.learnerId],  references: [learnerProfile.id] }),
  activity: one(lessonActivities, { fields: [activityAttemptsLog.activityId], references: [lessonActivities.id] }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  learnerAchievements: many(learnerAchievements),
}));

export const learnerAchievementsRelations = relations(learnerAchievements, ({ one }) => ({
  learner:     one(learnerProfile, { fields: [learnerAchievements.learnerId],     references: [learnerProfile.id] }),
  achievement: one(achievements,   { fields: [learnerAchievements.achievementId], references: [achievements.id] }),
}));

export const assistantDialoguesRelations = relations(assistantDialogues, ({ many }) => ({
  interactions: many(assistantInteractions),
}));

export const assistantInteractionsRelations = relations(assistantInteractions, ({ one }) => ({
  learner:       one(learnerProfile,      { fields: [assistantInteractions.learnerId],       references: [learnerProfile.id] }),
  dialogueShown: one(assistantDialogues,  { fields: [assistantInteractions.dialogueShownId], references: [assistantDialogues.id] }),
}));

// ---------------------------------------------------------------------------
// HANDWRITING_SAMPLES  (Slice 2 — raw handwriting data-collection pipeline)
//
// Stores one row per complete character-drawing attempt.
// Stroke telemetry is stored as JSON (strokes_json) — one row per attempt,
// NOT one row per coordinate point.
//
// activityId has NO FK constraint. The prototype supplies a hardcoded
// targetClass with no matching lesson_activities row. Tighten to a real FK
// when the curriculum layer is wired up.
//
// Review fields (observed_class, visual_valid, stroke_valid, rubric_version)
// are always NULL on newly collected samples. They are set during review.
// The persistence layer (handwritingRepository.ts) enforces this — callers
// use NewHandwritingAttemptDraft which structurally cannot set review fields.
// ---------------------------------------------------------------------------
export const handwritingSamples = sqliteTable("handwriting_samples", {
  id:            text("id").primaryKey(),            // UUID attempt ID
  participantId: text("participant_id"),              // nullable
  activityId:    text("activity_id"),                // nullable — soft ref, no FK cascade
  targetClass:   text("target_class").notNull(),     // BaybayinClass — from practice config
  attemptNumber: integer("attempt_number"),           // nullable only for legacy version-1 rows
  observedClass: text("observed_class"),             // nullable — null until reviewed
  imageUri:      text("image_uri"),                  // nullable — local file URI to PNG
  strokesJson:   text("strokes_json").notNull(),     // JSON.stringify(RecordedStroke[])
  canvasWidth:   real("canvas_width").notNull(),
  canvasHeight:  real("canvas_height").notNull(),
  screenWidth:   real("screen_width"),
  screenHeight:  real("screen_height"),
  pixelRatio:    real("pixel_ratio"),
  layoutMode:    text("layout_mode"),
  appVersion:    text("app_version"),
  durationMs:    real("duration_ms").notNull(),      // performance.now() delta in ms
  reviewStatus:  text("review_status").notNull().default("unreviewed"),
  visualValid:   integer("visual_valid").$type<0 | 1 | null>(),  // null = not yet reviewed
  strokeValid:   integer("stroke_valid").$type<0 | 1 | null>(),  // null = not yet reviewed
  rubricVersion: text("rubric_version"),             // nullable
  schemaVersion: integer("schema_version").notNull().default(HANDWRITING_SCHEMA_VERSION),
  createdAt:     integer("created_at").notNull(),    // Date.now() epoch ms
});

// ---------------------------------------------------------------------------
// COLLECTION_SESSION_STATE (active ordered-target collection session)
// ---------------------------------------------------------------------------
export const collectionSessionState = sqliteTable("collection_session_state", {
  id: text("id").primaryKey(), // Usually "active"
  // Current shape: Record<BaybayinClass, string[]>; repository also reads both legacy shapes.
  completedAttemptIdsJson: text("completed_attempt_ids_json").notNull(),
  isComplete: integer("is_complete", { mode: "boolean" }).notNull().default(false),
  updatedAt: integer("updated_at").notNull(), // Date.now() epoch ms
});

