INSERT INTO `habit_pause_periods` (`habit_id`, `paused_at`, `resumed_at`)
SELECT `id`, `paused_at`, NULL FROM `habits`
WHERE `paused_at` IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM `habit_pause_periods`
    WHERE `habit_id` = `habits`.`id` AND `resumed_at` IS NULL
  );
--> statement-breakpoint
ALTER TABLE `habits` DROP COLUMN `paused_at`;
--> statement-breakpoint
ALTER TABLE `settings` DROP COLUMN `timezone`;
