CREATE TABLE `achievements` (
	`id` text PRIMARY KEY NOT NULL,
	`badge_key` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`icon_asset_key` text DEFAULT '' NOT NULL,
	`xp_threshold` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `activity_attempts_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`learner_id` integer NOT NULL,
	`activity_id` text NOT NULL,
	`xp_awarded` integer DEFAULT 0 NOT NULL,
	`visual_accuracy` real,
	`sequence_accuracy` real,
	`kudlit_accuracy` integer,
	`error_category` text DEFAULT '' NOT NULL,
	`inference_time_ms` real,
	`timestamp` text NOT NULL,
	FOREIGN KEY (`learner_id`) REFERENCES `learner_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`activity_id`) REFERENCES `lesson_activities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `activity_practice_configs` (
	`activity_id` text PRIMARY KEY NOT NULL,
	`reference_vector_str` text DEFAULT '' NOT NULL,
	`has_kudlit` integer DEFAULT 0 NOT NULL,
	`stroke_count` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `lesson_activities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `activity_quiz_options` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`activity_id` text NOT NULL,
	`option_text` text NOT NULL,
	`is_correct` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `lesson_activities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `assistant_dialogues` (
	`id` text PRIMARY KEY NOT NULL,
	`trigger_rule_key` text NOT NULL,
	`context_stage` text DEFAULT '' NOT NULL,
	`dialogue_text` text NOT NULL,
	`assistant_mood` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `assistant_interactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`learner_id` integer NOT NULL,
	`dialogue_shown_id` text NOT NULL,
	`was_helpful` integer,
	`timestamp` text NOT NULL,
	FOREIGN KEY (`learner_id`) REFERENCES `learner_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`dialogue_shown_id`) REFERENCES `assistant_dialogues`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `baybayin_characters` (
	`id` text PRIMARY KEY NOT NULL,
	`glyph` text NOT NULL,
	`transliteration` text NOT NULL,
	`audio_asset_key` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `handwriting_samples` (
	`id` text PRIMARY KEY NOT NULL,
	`participant_id` text,
	`activity_id` text,
	`target_class` text NOT NULL,
	`observed_class` text,
	`image_uri` text,
	`strokes_json` text NOT NULL,
	`canvas_width` real NOT NULL,
	`canvas_height` real NOT NULL,
	`duration_ms` real NOT NULL,
	`review_status` text DEFAULT 'unreviewed' NOT NULL,
	`visual_valid` integer,
	`stroke_valid` integer,
	`rubric_version` text,
	`schema_version` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `learner_achievements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`learner_id` integer NOT NULL,
	`achievement_id` text NOT NULL,
	`unlocked_at` text NOT NULL,
	FOREIGN KEY (`learner_id`) REFERENCES `learner_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `learner_activity_summary` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`learner_id` integer NOT NULL,
	`activity_id` text NOT NULL,
	`is_cleared` integer DEFAULT 0 NOT NULL,
	`high_score_xp` integer DEFAULT 0 NOT NULL,
	`times_attempted` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`learner_id`) REFERENCES `learner_profile`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`activity_id`) REFERENCES `lesson_activities`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `learner_profile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nickname` text DEFAULT '' NOT NULL,
	`avatar_id` text DEFAULT '' NOT NULL,
	`total_xp` integer DEFAULT 0 NOT NULL,
	`current_streak` integer DEFAULT 0 NOT NULL,
	`last_active_date` text,
	`audio_enabled` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `learning_modules` (
	`id` text PRIMARY KEY NOT NULL,
	`stage_order` integer DEFAULT 0 NOT NULL,
	`stage_type` text DEFAULT '' NOT NULL,
	`value_focus` text DEFAULT '' NOT NULL,
	`title` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `lesson_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`lesson_id` text NOT NULL,
	`activity_type` text NOT NULL,
	`base_xp_reward` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `lessons` (
	`id` text PRIMARY KEY NOT NULL,
	`module_id` text NOT NULL,
	`character_id` text NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`module_id`) REFERENCES `learning_modules`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`character_id`) REFERENCES `baybayin_characters`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `rank_thresholds` (
	`level_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`rank_title` text NOT NULL,
	`min_xp_required` integer DEFAULT 0 NOT NULL
);
