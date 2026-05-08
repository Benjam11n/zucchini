CREATE TABLE `category_streak_state` (
	`category` text PRIMARY KEY NOT NULL,
	`current_streak` integer NOT NULL,
	`best_streak` integer NOT NULL,
	`last_evaluated_date` text
);
