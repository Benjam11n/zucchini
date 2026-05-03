CREATE TABLE `habit_streak_state` (
	`habit_id` integer PRIMARY KEY NOT NULL,
	`current_streak` integer NOT NULL,
	`best_streak` integer NOT NULL,
	`last_evaluated_date` text
);
