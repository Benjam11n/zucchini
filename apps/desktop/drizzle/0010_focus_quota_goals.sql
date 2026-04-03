CREATE TABLE `focus_quota_goals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`frequency` text NOT NULL,
	`target_minutes` integer NOT NULL,
	`created_at` text NOT NULL,
	`is_archived` integer DEFAULT false NOT NULL
);
