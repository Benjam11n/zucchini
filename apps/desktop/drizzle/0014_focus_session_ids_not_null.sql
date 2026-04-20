UPDATE `focus_sessions`
SET `timer_session_id` = 'legacy-' || `id`
WHERE `timer_session_id` IS NULL;
--> statement-breakpoint
PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `__new_focus_sessions` (
	`completed_at` text NOT NULL,
	`completed_date` text NOT NULL,
	`duration_seconds` integer NOT NULL,
	`entry_kind` text DEFAULT 'completed' NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`started_at` text NOT NULL,
	`timer_session_id` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_focus_sessions` (
	`completed_at`,
	`completed_date`,
	`duration_seconds`,
	`entry_kind`,
	`id`,
	`started_at`,
	`timer_session_id`
)
SELECT
	`completed_at`,
	`completed_date`,
	`duration_seconds`,
	`entry_kind`,
	`id`,
	`started_at`,
	`timer_session_id`
FROM `focus_sessions`;
--> statement-breakpoint
DROP TABLE `focus_sessions`;
--> statement-breakpoint
ALTER TABLE `__new_focus_sessions` RENAME TO `focus_sessions`;
--> statement-breakpoint
CREATE INDEX `focus_sessions_completed_at_idx` ON `focus_sessions` (`completed_at`);
--> statement-breakpoint
CREATE INDEX `focus_sessions_completed_date_idx` ON `focus_sessions` (`completed_date`);
--> statement-breakpoint
CREATE INDEX `focus_sessions_timer_session_id_idx` ON `focus_sessions` (`timer_session_id`);
--> statement-breakpoint
PRAGMA foreign_keys=ON;
