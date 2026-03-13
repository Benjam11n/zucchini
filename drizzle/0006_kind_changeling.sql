ALTER TABLE `habits`
ADD COLUMN `selected_weekdays` text;
--> statement-breakpoint
ALTER TABLE `habit_period_status`
ADD COLUMN `habit_selected_weekdays` text;
