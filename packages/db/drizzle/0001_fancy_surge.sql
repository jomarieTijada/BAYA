CREATE TABLE `collection_session_state` (
	`id` text PRIMARY KEY NOT NULL,
	`completed_attempt_ids_json` text NOT NULL,
	`is_complete` integer DEFAULT false NOT NULL,
	`updated_at` integer NOT NULL
);
