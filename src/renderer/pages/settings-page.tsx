import { motion } from "framer-motion";

import {
  staggerContainerVariants,
  staggerItemVariants,
} from "@/renderer/lib/motion";

import { AppearanceSettingsCard } from "../features/settings/appearance-settings-card";
import { HabitManagementCard } from "../features/settings/habit-management-card";
import { ReminderSettingsCard } from "../features/settings/reminder-settings-card";
import type { SettingsPageProps } from "../features/settings/types";

export function SettingsPage(props: SettingsPageProps) {
  return (
    <motion.div
      animate="animate"
      className="grid gap-6"
      initial="initial"
      variants={staggerContainerVariants}
    >
      <motion.section variants={staggerItemVariants}>
        <ReminderSettingsCard
          onChange={props.onChange}
          settings={props.settings}
        />
      </motion.section>
      <motion.section variants={staggerItemVariants}>
        <AppearanceSettingsCard
          onChange={props.onChange}
          settings={props.settings}
        />
      </motion.section>
      <motion.section variants={staggerItemVariants}>
        <HabitManagementCard
          habits={props.habits}
          onArchiveHabit={props.onArchiveHabit}
          onCreateHabit={props.onCreateHabit}
          onRenameHabit={props.onRenameHabit}
          onReorderHabits={props.onReorderHabits}
          onUpdateHabitCategory={props.onUpdateHabitCategory}
          onUpdateHabitFrequency={props.onUpdateHabitFrequency}
        />
      </motion.section>
    </motion.div>
  );
}
