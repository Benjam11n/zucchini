CREATE TABLE `focus_timer_state` (
	`break_variant` text,
	`completed_focus_cycles` integer NOT NULL,
	`cycle_id` text,
	`ends_at` text,
	`focus_duration_ms` integer NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`last_completed_break_completed_at` text,
	`last_completed_break_timer_session_id` text,
	`last_completed_break_variant` text,
	`last_updated_at` text NOT NULL,
	`phase` text NOT NULL,
	`remaining_ms` integer NOT NULL,
	`started_at` text,
	`status` text NOT NULL,
	`timer_session_id` text
);
