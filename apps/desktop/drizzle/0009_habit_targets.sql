ALTER TABLE `habits` ADD COLUMN `target_count` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `habit_period_status` ADD COLUMN `completed_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `habit_period_status` ADD COLUMN `habit_target_count` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
UPDATE `habits`
SET `target_count` = 1
WHERE `target_count` IS NULL;--> statement-breakpoint
UPDATE `habit_period_status`
SET
  `completed_count` = CASE WHEN `completed` = 1 THEN 1 ELSE 0 END,
  `habit_target_count` = 1
WHERE `completed_count` IS NULL OR `habit_target_count` IS NULL;
