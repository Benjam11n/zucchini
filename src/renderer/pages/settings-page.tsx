import { motion } from "framer-motion";

import { AppearanceSettingsCard } from "@/renderer/features/settings/appearance-settings-card";
import { HabitManagementCard } from "@/renderer/features/settings/habit-management-card";
import { ReminderSettingsCard } from "@/renderer/features/settings/reminder-settings-card";
import type { SettingsPageProps } from "@/renderer/features/settings/types";
import {
  staggerContainerVariants,
  staggerItemVariants,
} from "@/renderer/lib/motion";

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
