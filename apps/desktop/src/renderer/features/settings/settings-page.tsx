import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { Bell, ListTodo, Palette, TimerReset } from "lucide-react";
/**
 * Settings tab page.
 *
 * It groups app preferences, reminder controls, appearance options, and habit
 * management into one place while surfacing the current save state.
 */
import { useEffect, useState } from "react";

import { AppearanceSettingsCard } from "@/renderer/features/settings/components/appearance/appearance-settings-card";
import { DataManagementSettingsCard } from "@/renderer/features/settings/components/general/data-management-settings-card";
import { PomodoroSettingsCard } from "@/renderer/features/settings/components/general/pomodoro-settings-card";
import { ReminderSettingsCard } from "@/renderer/features/settings/components/general/reminder-settings-card";
import { UpdateSettingsCard } from "@/renderer/features/settings/components/general/update-settings-card";
import { CategorySettingsCard } from "@/renderer/features/settings/components/habits/category-settings-card";
import { HabitManagementCard } from "@/renderer/features/settings/components/habits/habit-management-card";
import type { SettingsPageProps } from "@/renderer/features/settings/settings.types";
import { Badge } from "@/renderer/shared/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/renderer/shared/components/ui/tabs";
import {
  staggerContainerVariants,
  staggerItemVariants,
} from "@/renderer/shared/lib/motion";

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
    // Hide immediately when saved, instead of showing a lingering "Saved" label
    return null;
  }

  if (savePhase === "error") {
    return { text: "Save failed", variant: "destructive" as const };
  }

  return null;
}

export function SettingsPage(props: SettingsPageProps) {
  const currentSaveStatus = getSaveStatus(props.savePhase);
  const [activeStatus, setActiveStatus] = useState(currentSaveStatus);

  useEffect(() => {
    if (currentSaveStatus) {
      setActiveStatus(currentSaveStatus);
    } else {
      // Buffer the clearance by a few milliseconds so we don't unmount the toast
      // in the middle of a rapid state transition (e.g. pending -> idle -> saving)
      const timer = setTimeout(() => {
        setActiveStatus(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentSaveStatus]);

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        animate="animate"
        className="grid gap-6"
        initial="initial"
        variants={staggerContainerVariants}
      >
        <AnimatePresence>
          {activeStatus && (
            <m.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border border-border/60 bg-background/80 p-1 shadow-lg backdrop-blur-md"
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              layout
              transition={{ duration: 0.2 }}
            >
              <m.div layout>
                <Badge variant={activeStatus.variant}>
                  {activeStatus.text}
                </Badge>
              </m.div>
              {props.savePhase === "error" ? (
                <m.p
                  layout
                  className="px-2 text-sm font-medium text-destructive"
                >
                  {props.saveErrorMessage}
                </m.p>
              ) : null}
            </m.div>
          )}
        </AnimatePresence>

        <Tabs className="w-full" defaultValue="general">
          <m.section variants={staggerItemVariants}>
            <TabsList className="mb-6 w-full bg-muted/80 p-1">
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
                focusQuotaGoals={props.focusQuotaGoals}
                habits={props.habits}
                onArchiveHabit={props.onArchiveHabit}
                onArchiveFocusQuotaGoal={props.onArchiveFocusQuotaGoal}
                onCreateHabit={props.onCreateHabit}
                onRenameHabit={props.onRenameHabit}
                onReorderHabits={props.onReorderHabits}
                onUpsertFocusQuotaGoal={props.onUpsertFocusQuotaGoal}
                onUnarchiveHabit={props.onUnarchiveHabit}
                onUpdateHabitCategory={props.onUpdateHabitCategory}
                onUpdateHabitFrequency={props.onUpdateHabitFrequency}
                onUpdateHabitWeekdays={props.onUpdateHabitWeekdays}
                {...(props.onUpdateHabitTargetCount
                  ? {
                      onUpdateHabitTargetCount: props.onUpdateHabitTargetCount,
                    }
                  : {})}
              />
            </m.div>
          </TabsContent>
        </Tabs>
      </m.div>
    </LazyMotion>
  );
}
