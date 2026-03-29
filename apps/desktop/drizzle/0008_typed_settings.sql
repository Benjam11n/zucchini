CREATE TABLE `__new_settings` (
	`category_preferences` text NOT NULL,
	`focus_cycles_before_long_break` integer NOT NULL,
	`focus_default_duration_seconds` integer NOT NULL,
	`focus_long_break_seconds` integer NOT NULL,
	`focus_short_break_seconds` integer NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`launch_at_login` integer NOT NULL,
	`minimize_to_tray` integer NOT NULL,
	`reminder_enabled` integer NOT NULL,
	`reminder_snooze_minutes` integer NOT NULL,
	`reminder_time` text NOT NULL,
	`reset_focus_timer_shortcut` text NOT NULL,
	`theme_mode` text NOT NULL,
	`timezone` text NOT NULL,
	`toggle_focus_timer_shortcut` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_settings` (
	`category_preferences`,
	`focus_cycles_before_long_break`,
	`focus_default_duration_seconds`,
	`focus_long_break_seconds`,
	`focus_short_break_seconds`,
	`id`,
	`launch_at_login`,
	`minimize_to_tray`,
	`reminder_enabled`,
	`reminder_snooze_minutes`,
	`reminder_time`,
	`reset_focus_timer_shortcut`,
	`theme_mode`,
	`timezone`,
	`toggle_focus_timer_shortcut`
)
SELECT
	json_object(
		'fitness', json_object(
			'color', COALESCE((SELECT value FROM `settings` WHERE key = 'categoryColorFitness'), '#FF2D55'),
			'label', COALESCE((SELECT value FROM `settings` WHERE key = 'categoryLabelFitness'), 'Fitness')
		),
		'nutrition', json_object(
			'color', COALESCE((SELECT value FROM `settings` WHERE key = 'categoryColorNutrition'), '#A3F900'),
			'label', COALESCE((SELECT value FROM `settings` WHERE key = 'categoryLabelNutrition'), 'Nutrition')
		),
		'productivity', json_object(
			'color', COALESCE((SELECT value FROM `settings` WHERE key = 'categoryColorProductivity'), '#04C7DD'),
			'label', COALESCE((SELECT value FROM `settings` WHERE key = 'categoryLabelProductivity'), 'Productivity')
		)
	),
	COALESCE(CAST((SELECT value FROM `settings` WHERE key = 'focusCyclesBeforeLongBreak') AS integer), 2),
	COALESCE(CAST((SELECT value FROM `settings` WHERE key = 'focusDefaultDurationSeconds') AS integer), 2700),
	COALESCE(
		CAST((SELECT value FROM `settings` WHERE key = 'focusLongBreakSeconds') AS integer),
		CAST((SELECT value FROM `settings` WHERE key = 'focusLongBreakMinutes') AS integer) * 60,
		1800
	),
	COALESCE(
		CAST((SELECT value FROM `settings` WHERE key = 'focusShortBreakSeconds') AS integer),
		CAST((SELECT value FROM `settings` WHERE key = 'focusShortBreakMinutes') AS integer) * 60,
		600
	),
	1,
	CASE COALESCE((SELECT value FROM `settings` WHERE key = 'launchAtLogin'), 'false')
		WHEN 'true' THEN 1
		ELSE 0
	END,
	CASE COALESCE((SELECT value FROM `settings` WHERE key = 'minimizeToTray'), 'false')
		WHEN 'true' THEN 1
		ELSE 0
	END,
	CASE COALESCE((SELECT value FROM `settings` WHERE key = 'reminderEnabled'), 'true')
		WHEN 'true' THEN 1
		ELSE 0
	END,
	COALESCE(CAST((SELECT value FROM `settings` WHERE key = 'reminderSnoozeMinutes') AS integer), 15),
	COALESCE((SELECT value FROM `settings` WHERE key = 'reminderTime'), '20:30'),
	COALESCE((SELECT value FROM `settings` WHERE key = 'resetFocusTimerShortcut'), ''),
	COALESCE((SELECT value FROM `settings` WHERE key = 'themeMode'), 'system'),
	COALESCE((SELECT value FROM `settings` WHERE key = 'timezone'), 'UTC'),
	COALESCE((SELECT value FROM `settings` WHERE key = 'toggleFocusTimerShortcut'), '')
WHERE EXISTS (SELECT 1 FROM `settings`);
--> statement-breakpoint
DROP TABLE `settings`;
--> statement-breakpoint
ALTER TABLE `__new_settings` RENAME TO `settings`;
