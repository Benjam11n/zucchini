import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { Bell, ListTodo, Palette, TimerReset } from "lucide-react";

/**
 * Settings tab page.
 *
 * It groups app preferences, reminder controls, appearance options, and habit
 * management into one place while surfacing the current save state.
 */
import { AppearanceSettingsCard } from "@/renderer/features/settings/components/appearance/appearance-settings-card";
import { FocusQuotaSettingsCard } from "@/renderer/features/settings/components/focus/focus-quota-settings-card";
import { DataManagementSettingsCard } from "@/renderer/features/settings/components/general/data-management-settings-card";
import { PomodoroSettingsCard } from "@/renderer/features/settings/components/general/pomodoro-settings-card";
import { ReminderSettingsCard } from "@/renderer/features/settings/components/general/reminder-settings-card";
import { UpdateSettingsCard } from "@/renderer/features/settings/components/general/update-settings-card";
import { WindDownSettingsCard } from "@/renderer/features/settings/components/general/wind-down-settings-card";
import { CategorySettingsCard } from "@/renderer/features/settings/components/habits/category-settings-card";
import { HabitManagementCard } from "@/renderer/features/settings/components/habits/habit-management-card";
import { getSettingsSaveStatus } from "@/renderer/features/settings/lib/settings-save-status";
import type {
  SettingsPageActions,
  SettingsPageViewModel,
} from "@/renderer/features/settings/settings.types";
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

interface SettingsPageProps {
  actions: SettingsPageActions;
  viewModel: SettingsPageViewModel;
}

export function SettingsPage(props: SettingsPageProps) {
  const { actions, viewModel } = props;
  const currentSaveStatus = getSettingsSaveStatus(viewModel.savePhase);

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        animate="animate"
        className="grid gap-6"
        initial="initial"
        variants={staggerContainerVariants}
      >
        <AnimatePresence>
          {currentSaveStatus && (
            <m.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border border-border/60 bg-background/80 p-1 shadow-lg backdrop-blur-md"
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              layout
              key={currentSaveStatus.text}
              transition={{ duration: 0.2 }}
            >
              <m.div layout>
                <Badge variant={currentSaveStatus.variant}>
                  {currentSaveStatus.text}
                </Badge>
              </m.div>
              {viewModel.savePhase === "error" ? (
                <m.p
                  layout
                  className="px-2 text-sm font-medium text-destructive"
                >
                  {viewModel.saveErrorMessage}
                </m.p>
              ) : null}
            </m.div>
          )}
        </AnimatePresence>

        <Tabs className="w-full" defaultValue="general">
          <m.section variants={staggerItemVariants}>
            <TabsList className="mb-6 w-full">
              <TabsTrigger className="flex-1" value="general">
                <Bell className="size-4" />
                General
              </TabsTrigger>
              <TabsTrigger className="flex-1" value="desktop">
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
                fieldErrors={viewModel.fieldErrors}
                onChange={actions.settings.change}
                settings={viewModel.settings}
              />
              <UpdateSettingsCard />
              <DataManagementSettingsCard
                actions={actions.dataManagement}
                onChange={actions.settings.change}
                settings={viewModel.settings}
              />
            </m.div>
          </TabsContent>

          <TabsContent value="pomodoro">
            <m.section variants={staggerItemVariants}>
              <PomodoroSettingsCard
                fieldErrors={viewModel.fieldErrors}
                onChange={actions.settings.change}
                settings={viewModel.settings}
              />
            </m.section>
          </TabsContent>

          <TabsContent value="appearance">
            <m.section variants={staggerItemVariants}>
              <AppearanceSettingsCard
                fieldErrors={viewModel.fieldErrors}
                onChange={actions.settings.change}
                settings={viewModel.settings}
              />
            </m.section>
          </TabsContent>

          <TabsContent value="desktop">
            <m.div className="grid gap-6" variants={staggerItemVariants}>
              <WindDownSettingsCard
                fieldErrors={viewModel.fieldErrors}
                onChange={actions.settings.change}
                onOpenWindDown={actions.openWindDown}
                settings={viewModel.settings}
              />
              <CategorySettingsCard
                fieldErrors={viewModel.fieldErrors}
                onChange={actions.settings.change}
                settings={viewModel.settings}
              />
              <HabitManagementCard
                actions={actions.habits}
                habits={viewModel.habits}
              />
              <FocusQuotaSettingsCard
                focusQuotaGoals={viewModel.focusQuotaGoals}
                onArchiveFocusQuotaGoal={actions.focusQuotaGoals.archive}
                onUnarchiveFocusQuotaGoal={actions.focusQuotaGoals.unarchive}
                onUpsertFocusQuotaGoal={actions.focusQuotaGoals.upsert}
              />
            </m.div>
          </TabsContent>
        </Tabs>
      </m.div>
    </LazyMotion>
  );
}
