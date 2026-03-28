ALTER TABLE `focus_sessions`
ADD COLUMN `timer_session_id` text;
--> statement-breakpoint
ALTER TABLE `focus_sessions`
ADD COLUMN `entry_kind` text DEFAULT 'completed' NOT NULL;
--> statement-breakpoint
CREATE INDEX `focus_sessions_timer_session_id_idx` ON `focus_sessions` (`timer_session_id`);
