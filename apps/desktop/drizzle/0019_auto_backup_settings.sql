ALTER TABLE `settings` ADD `auto_backup_cadence` text DEFAULT 'off' NOT NULL;
--> statement-breakpoint
ALTER TABLE `settings` ADD `auto_backup_last_run_at` text;
