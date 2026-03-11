import { Bell, ListTodo, Palette } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppearanceSettingsCard } from "@/renderer/features/settings/appearance-settings-card";
import { HabitManagementCard } from "@/renderer/features/settings/habit-management-card";
import { ReminderSettingsCard } from "@/renderer/features/settings/reminder-settings-card";
import { StarterPacksCard } from "@/renderer/features/settings/starter-packs-card";
import type { SettingsPageProps } from "@/renderer/features/settings/types";

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
    <div className="grid gap-6">
      {props.savePhase === "idle" ? null : (
        <section>
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
        </section>
      )}

      <Tabs className="w-full" defaultValue="general">
        <section>
          <TabsList className="w-full rounded-2xl bg-muted/80 p-1">
            <TabsTrigger className="flex-1" value="general">
              <Bell className="size-4" />
              General
            </TabsTrigger>
            <TabsTrigger className="flex-1" value="appearance">
              <Palette className="size-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger className="flex-1" value="habits">
              <ListTodo className="size-4" />
              Habits
            </TabsTrigger>
          </TabsList>
        </section>

        <TabsContent value="general">
          <section>
            <ReminderSettingsCard
              fieldErrors={props.fieldErrors}
              onChange={props.onChange}
              settings={props.settings}
            />
          </section>
        </TabsContent>

        <TabsContent value="appearance">
          <section>
            <AppearanceSettingsCard
              fieldErrors={props.fieldErrors}
              onChange={props.onChange}
              settings={props.settings}
            />
          </section>
        </TabsContent>

        <TabsContent value="habits">
          <div className="grid gap-6">
            <HabitManagementCard
              habits={props.habits}
              onArchiveHabit={props.onArchiveHabit}
              onCreateHabit={props.onCreateHabit}
              onRenameHabit={props.onRenameHabit}
              onReorderHabits={props.onReorderHabits}
              onUpdateHabitCategory={props.onUpdateHabitCategory}
              onUpdateHabitFrequency={props.onUpdateHabitFrequency}
            />
            <StarterPacksCard onApplyStarterPack={props.onApplyStarterPack} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
