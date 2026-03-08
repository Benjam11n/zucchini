CREATE TABLE `reminder_runtime_state` (
	`id` integer PRIMARY KEY NOT NULL,
	`last_midnight_warning_sent_at` text,
	`last_missed_reminder_sent_at` text,
	`last_reminder_sent_at` text,
	`snoozed_until` text
);
