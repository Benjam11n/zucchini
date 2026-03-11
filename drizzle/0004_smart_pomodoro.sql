CREATE TABLE `focus_sessions` (
	`completed_at` text NOT NULL,
	`completed_date` text NOT NULL,
	`duration_seconds` integer NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`started_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `focus_sessions_completed_at_idx` ON `focus_sessions` (`completed_at`);
--> statement-breakpoint
CREATE INDEX `focus_sessions_completed_date_idx` ON `focus_sessions` (`completed_date`);
