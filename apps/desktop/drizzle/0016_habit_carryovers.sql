CREATE TABLE `habit_carryovers` (
	`source_date` text NOT NULL,
	`target_date` text NOT NULL,
	`habit_id` integer NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`completed_at` text,
	`created_at` text NOT NULL,
	PRIMARY KEY(`source_date`, `target_date`, `habit_id`)
);
--> statement-breakpoint
CREATE INDEX `habit_carryovers_source_date_idx` ON `habit_carryovers` (`source_date`);
--> statement-breakpoint
CREATE INDEX `habit_carryovers_target_date_idx` ON `habit_carryovers` (`target_date`);
