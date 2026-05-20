CREATE TABLE `habit_pause_periods` (
  `habit_id` integer NOT NULL,
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `paused_at` text NOT NULL,
  `resumed_at` text
);
--> statement-breakpoint
CREATE INDEX `habit_pause_periods_habit_id_idx` ON `habit_pause_periods` (`habit_id`);
--> statement-breakpoint
CREATE INDEX `habit_pause_periods_paused_at_idx` ON `habit_pause_periods` (`paused_at`);
--> statement-breakpoint
CREATE INDEX `habit_pause_periods_resumed_at_idx` ON `habit_pause_periods` (`resumed_at`);
--> statement-breakpoint
INSERT INTO `habit_pause_periods` (`habit_id`, `paused_at`, `resumed_at`)
SELECT `id`, `paused_at`, NULL
FROM `habits`
WHERE `paused_at` IS NOT NULL;
