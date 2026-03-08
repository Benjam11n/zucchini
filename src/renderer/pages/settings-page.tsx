import { LazyMotion, domAnimation, m } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { AppearanceSettingsCard } from "@/renderer/features/settings/appearance-settings-card";
import { HabitManagementCard } from "@/renderer/features/settings/habit-management-card";
import { ReminderSettingsCard } from "@/renderer/features/settings/reminder-settings-card";
import type { SettingsPageProps } from "@/renderer/features/settings/types";
import {
  staggerContainerVariants,
  staggerItemVariants,
} from "@/renderer/lib/motion";

function getSaveStatus(savePhase: SettingsPageProps["savePhase"]) {
  if (savePhase === "pending") {
    return { text: "Unsaved changes", variant: "outline" as const };
  }

  if (savePhase === "invalid") {
    return {
      text: "Fix highlighted settings",
      variant: "destructive" as const,
    };
  }

  if (savePhase === "saving") {
    return { text: "Saving...", variant: "secondary" as const };
  }

  if (savePhase === "saved") {
    return { text: "Saved", variant: "secondary" as const };
  }

  if (savePhase === "error") {
    return { text: "Save failed", variant: "destructive" as const };
  }

  return null;
}

export function SettingsPage(props: SettingsPageProps) {
  const saveStatus = getSaveStatus(props.savePhase);

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        animate="animate"
        className="grid gap-6"
        initial="initial"
        variants={staggerContainerVariants}
      >
        {props.savePhase === "idle" ? null : (
          <m.section variants={staggerItemVariants}>
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3">
              {saveStatus ? (
                <Badge variant={saveStatus.variant}>{saveStatus.text}</Badge>
              ) : null}
              {props.savePhase === "error" ? (
                <p className="text-sm text-destructive">
                  {props.saveErrorMessage}
                </p>
              ) : null}
            </div>
          </m.section>
        )}

        <m.section variants={staggerItemVariants}>
          <ReminderSettingsCard
            fieldErrors={props.fieldErrors}
            onChange={props.onChange}
            settings={props.settings}
          />
        </m.section>
        <m.section variants={staggerItemVariants}>
          <AppearanceSettingsCard
            fieldErrors={props.fieldErrors}
            onChange={props.onChange}
            settings={props.settings}
          />
        </m.section>
        <m.section variants={staggerItemVariants}>
          <HabitManagementCard
            habits={props.habits}
            onArchiveHabit={props.onArchiveHabit}
            onCreateHabit={props.onCreateHabit}
            onRenameHabit={props.onRenameHabit}
            onReorderHabits={props.onReorderHabits}
            onUpdateHabitCategory={props.onUpdateHabitCategory}
            onUpdateHabitFrequency={props.onUpdateHabitFrequency}
          />
        </m.section>
      </m.div>
    </LazyMotion>
  );
}
