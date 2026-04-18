ALTER TABLE `daily_summary` ADD COLUMN `day_status` text;
--> statement-breakpoint

CREATE TABLE `day_status` (
	`date` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`created_at` text NOT NULL
);
