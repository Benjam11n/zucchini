/**
 * Settings tab page.
 *
 * It groups app preferences, reminder controls, appearance options, and habit
 * management into one place while surfacing the current save state.
 */
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Bell, ListTodo, Palette, TimerReset } from "lucide-react";

import { AppearanceSettingsCard } from "@/renderer/features/settings/components/appearance/appearance-settings-card";
import { DataManagementSettingsCard } from "@/renderer/features/settings/components/general/data-management-settings-card";
import { PomodoroSettingsCard } from "@/renderer/features/settings/components/general/pomodoro-settings-card";
import { ReminderSettingsCard } from "@/renderer/features/settings/components/general/reminder-settings-card";
import { UpdateSettingsCard } from "@/renderer/features/settings/components/general/update-settings-card";
import { CategorySettingsCard } from "@/renderer/features/settings/components/habits/category-settings-card";
import { HabitManagementCard } from "@/renderer/features/settings/components/habits/habit-management-card";
import type { SettingsPageProps } from "@/renderer/features/settings/settings.types";
import {
  staggerContainerVariants,
  staggerItemVariants,
} from "@/renderer/shared/lib/motion";
import { Badge } from "@/renderer/shared/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/renderer/shared/ui/tabs";

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

        <Tabs className="w-full" defaultValue="general">
          <m.section variants={staggerItemVariants}>
            <TabsList className="w-full bg-muted/80 p-1">
              <TabsTrigger className="flex-1" value="general">
                <Bell className="size-4" />
                General
              </TabsTrigger>
              <TabsTrigger className="flex-1" value="habits">
                <ListTodo className="size-4" />
                Habits
              </TabsTrigger>
              <TabsTrigger className="flex-1" value="pomodoro">
                <TimerReset className="size-4" />
                Pomodoro
              </TabsTrigger>
              <TabsTrigger className="flex-1" value="appearance">
                <Palette className="size-4" />
                Appearance
              </TabsTrigger>
            </TabsList>
          </m.section>

          <TabsContent value="general">
            <m.div className="grid gap-6" variants={staggerItemVariants}>
              <ReminderSettingsCard
                fieldErrors={props.fieldErrors}
                onChange={props.onChange}
                settings={props.settings}
              />
              <UpdateSettingsCard />
              <DataManagementSettingsCard />
            </m.div>
          </TabsContent>

          <TabsContent value="pomodoro">
            <m.section variants={staggerItemVariants}>
              <PomodoroSettingsCard
                fieldErrors={props.fieldErrors}
                onChange={props.onChange}
                settings={props.settings}
              />
            </m.section>
          </TabsContent>

          <TabsContent value="appearance">
            <m.section variants={staggerItemVariants}>
              <AppearanceSettingsCard
                fieldErrors={props.fieldErrors}
                onChange={props.onChange}
                settings={props.settings}
              />
            </m.section>
          </TabsContent>

          <TabsContent value="habits">
            <m.div className="grid gap-6" variants={staggerItemVariants}>
              <CategorySettingsCard
                fieldErrors={props.fieldErrors}
                onChange={props.onChange}
                settings={props.settings}
              />
              <HabitManagementCard
                habits={props.habits}
                onArchiveHabit={props.onArchiveHabit}
                onCreateHabit={props.onCreateHabit}
                onRenameHabit={props.onRenameHabit}
                onReorderHabits={props.onReorderHabits}
                onUnarchiveHabit={props.onUnarchiveHabit}
                onUpdateHabitCategory={props.onUpdateHabitCategory}
                onUpdateHabitFrequency={props.onUpdateHabitFrequency}
                onUpdateHabitWeekdays={props.onUpdateHabitWeekdays}
              />
            </m.div>
          </TabsContent>
        </Tabs>
      </m.div>
    </LazyMotion>
  );
}
