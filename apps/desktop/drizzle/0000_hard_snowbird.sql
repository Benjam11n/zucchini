CREATE TABLE `daily_habit_status` (
	`completed` integer DEFAULT false NOT NULL,
	`date` text NOT NULL,
	`habit_category` text DEFAULT 'productivity' NOT NULL,
	`habit_created_at` text NOT NULL,
	`habit_id` integer NOT NULL,
	`habit_name` text NOT NULL,
	`habit_sort_order` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`date`, `habit_id`)
);
--> statement-breakpoint
CREATE TABLE `daily_summary` (
	`all_completed` integer NOT NULL,
	`completed_at` text,
	`date` text PRIMARY KEY NOT NULL,
	`freeze_used` integer NOT NULL,
	`streak_count_after_day` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `habits` (
	`category` text DEFAULT 'productivity' NOT NULL,
	`created_at` text NOT NULL,
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `streak_state` (
	`available_freezes` integer NOT NULL,
	`best_streak` integer NOT NULL,
	`current_streak` integer NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`last_evaluated_date` text
);
