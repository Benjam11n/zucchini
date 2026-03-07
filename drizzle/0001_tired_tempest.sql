ALTER TABLE `daily_habit_status` RENAME TO `__old_habit_period_status`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `habit_period_status` (
	`completed` integer DEFAULT false NOT NULL,
	`frequency` text DEFAULT 'daily' NOT NULL,
	`habit_category` text DEFAULT 'productivity' NOT NULL,
	`habit_created_at` text NOT NULL,
	`habit_id` integer NOT NULL,
	`habit_name` text NOT NULL,
	`habit_sort_order` integer DEFAULT 0 NOT NULL,
	`period_end` text NOT NULL,
	`period_start` text NOT NULL,
	PRIMARY KEY(`frequency`, `period_start`, `habit_id`)
);
--> statement-breakpoint
INSERT INTO `habit_period_status`("completed", "frequency", "habit_category", "habit_created_at", "habit_id", "habit_name", "habit_sort_order", "period_end", "period_start") SELECT "completed", 'daily', "habit_category", "habit_created_at", "habit_id", "habit_name", "habit_sort_order", "date", "date" FROM `__old_habit_period_status`;--> statement-breakpoint
DROP TABLE `__old_habit_period_status`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `habits` ADD `frequency` text DEFAULT 'daily' NOT NULL;
