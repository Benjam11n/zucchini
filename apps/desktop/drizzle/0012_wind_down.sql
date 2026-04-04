ALTER TABLE `settings` ADD `wind_down_time` text NOT NULL DEFAULT '21:30';
--> statement-breakpoint

CREATE TABLE `wind_down_actions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` text NOT NULL,
	`sort_order` integer NOT NULL
);
--> statement-breakpoint

CREATE TABLE `wind_down_action_status` (
	`action_id` integer NOT NULL,
	`completed` integer NOT NULL DEFAULT false,
	`completed_at` text,
	`date` text NOT NULL,
	PRIMARY KEY(`date`, `action_id`)
);
--> statement-breakpoint

CREATE INDEX `wind_down_action_status_action_id_idx` ON `wind_down_action_status` (`action_id`);
--> statement-breakpoint
CREATE INDEX `wind_down_action_status_date_idx` ON `wind_down_action_status` (`date`);
--> statement-breakpoint

CREATE TABLE `wind_down_runtime_state` (
	`id` integer PRIMARY KEY NOT NULL,
	`last_reminder_sent_at` text
);
