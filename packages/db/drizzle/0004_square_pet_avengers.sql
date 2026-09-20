PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_handwriting_samples` (
	`id` text PRIMARY KEY NOT NULL,
	`participant_id` text,
	`activity_id` text,
	`target_class` text NOT NULL,
	`attempt_number` integer,
	`observed_class` text,
	`image_uri` text,
	`strokes_json` text NOT NULL,
	`canvas_width` real NOT NULL,
	`canvas_height` real NOT NULL,
	`screen_width` real,
	`screen_height` real,
	`pixel_ratio` real,
	`layout_mode` text,
	`app_version` text,
	`duration_ms` real NOT NULL,
	`review_status` text DEFAULT 'unreviewed' NOT NULL,
	`visual_valid` integer,
	`stroke_valid` integer,
	`rubric_version` text,
	`schema_version` integer DEFAULT 2 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_handwriting_samples`("id", "participant_id", "activity_id", "target_class", "attempt_number", "observed_class", "image_uri", "strokes_json", "canvas_width", "canvas_height", "screen_width", "screen_height", "pixel_ratio", "layout_mode", "app_version", "duration_ms", "review_status", "visual_valid", "stroke_valid", "rubric_version", "schema_version", "created_at") SELECT "id", "participant_id", "activity_id", "target_class", "attempt_number", "observed_class", "image_uri", "strokes_json", "canvas_width", "canvas_height", "screen_width", "screen_height", "pixel_ratio", "layout_mode", "app_version", "duration_ms", "review_status", "visual_valid", "stroke_valid", "rubric_version", "schema_version", "created_at" FROM `handwriting_samples`;--> statement-breakpoint
DROP TABLE `handwriting_samples`;--> statement-breakpoint
ALTER TABLE `__new_handwriting_samples` RENAME TO `handwriting_samples`;--> statement-breakpoint
PRAGMA foreign_keys=ON;