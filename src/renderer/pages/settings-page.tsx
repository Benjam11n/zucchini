import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import type { HabitWithStatus } from "../../shared/domain/habit";
import type { AppSettings, ThemeMode } from "../../shared/domain/settings";

interface SettingsPageProps {
  habits: HabitWithStatus[];
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
  onSave: (settings: AppSettings) => Promise<void>;
  onCreateHabit: (name: string) => Promise<void>;
  onRenameHabit: (habitId: number, name: string) => Promise<void>;
  onArchiveHabit: (habitId: number) => Promise<void>;
  onReorderHabits: (habits: HabitWithStatus[]) => Promise<void>;
}

const themeOptions: { description: string; label: string; value: ThemeMode }[] =
  [
    {
      description: "Follow your macOS or Windows appearance.",
      label: "System",
      value: "system",
    },
    {
      description: "Keep the brighter greenhouse palette.",
      label: "Light",
      value: "light",
    },
    {
      description: "Switch to a dimmer night palette.",
      label: "Dark",
      value: "dark",
    },
  ];

function reorderHabitList(
  habits: HabitWithStatus[],
  habitId: number,
  direction: -1 | 1
): HabitWithStatus[] {
  const index = habits.findIndex((habit) => habit.id === habitId);
  const targetIndex = index + direction;

  if (index === -1 || targetIndex < 0 || targetIndex >= habits.length) {
    return habits;
  }

  const nextHabits = [...habits];
  const [movedHabit] = nextHabits.splice(index, 1);
  nextHabits.splice(targetIndex, 0, movedHabit);
  return nextHabits;
}

export function SettingsPage({
  habits,
  settings,
  onChange,
  onSave,
  onCreateHabit,
  onRenameHabit,
  onArchiveHabit,
  onReorderHabits,
}: SettingsPageProps) {
  const [newHabitName, setNewHabitName] = useState("");

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardDescription>Settings</CardDescription>
          <CardTitle>Reminders</CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reminder preferences</CardTitle>
          <CardDescription>
            Structured with shadcn form primitives so future dialogs and
            settings panels can reuse the same controls.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <Card
            className="border-border/70 bg-muted/30 py-0 shadow-none"
            size="sm"
          >
            <CardContent className="flex items-center justify-between gap-4 py-3">
              <div className="space-y-1">
                <Label htmlFor="reminder-enabled">Enable reminder</Label>
                <p className="text-sm text-muted-foreground">
                  Show a desktop reminder if today&apos;s checklist is still
                  open.
                </p>
              </div>
              <Switch
                checked={settings.reminderEnabled}
                id="reminder-enabled"
                onCheckedChange={(checked) =>
                  onChange({
                    ...settings,
                    reminderEnabled: checked,
                  })
                }
              />
            </CardContent>
          </Card>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="reminder-time">Reminder time</Label>
              <Input
                id="reminder-time"
                onChange={(event) =>
                  onChange({
                    ...settings,
                    reminderTime: event.target.value,
                  })
                }
                type="time"
                value={settings.reminderTime}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reminder-timezone">Timezone</Label>
              <Input
                id="reminder-timezone"
                onChange={(event) =>
                  onChange({
                    ...settings,
                    timezone: event.target.value,
                  })
                }
                type="text"
                value={settings.timezone}
              />
            </div>
          </div>

          <Separator />

          <Button
            className="w-fit"
            onClick={() => {
              void onSave(settings);
            }}
            type="button"
          >
            Save settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Choose whether Zucchini follows the OS appearance or stays fixed.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <RadioGroup
            className="grid gap-3 sm:grid-cols-3"
            onValueChange={(value) => {
              onChange({
                ...settings,
                themeMode: value as ThemeMode,
              });
            }}
            value={settings.themeMode}
          >
            {themeOptions.map((option) => (
              <Label
                className={cn(
                  "flex min-h-24 cursor-pointer items-start gap-3 rounded-xl border border-border/70 bg-background px-4 py-4 text-left transition-colors hover:bg-muted/60",
                  settings.themeMode === option.value &&
                    "border-primary bg-primary/10 text-foreground"
                )}
                htmlFor={`theme-mode-${option.value}`}
                key={option.value}
              >
                <RadioGroupItem
                  className="mt-0.5"
                  id={`theme-mode-${option.value}`}
                  value={option.value}
                />
                <span className="grid gap-1">
                  <span className="text-sm font-semibold">{option.label}</span>
                  <span className="text-sm text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </Label>
            ))}
          </RadioGroup>
          <Separator />
          <Button
            className="w-fit"
            onClick={() => {
              void onSave(settings);
            }}
            type="button"
          >
            Save settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Habits</CardDescription>
          <CardTitle>Manage checklist</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {habits.map((habit, index) => (
            <Card
              className="border-border/70 bg-muted/30 py-0 shadow-none"
              key={habit.id}
              size="sm"
            >
              <CardContent className="grid gap-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <Label
                    className="text-sm font-medium"
                    htmlFor={`habit-name-${habit.id}`}
                  >
                    {habit.name}
                  </Label>
                  <Badge variant="outline">#{index + 1}</Badge>
                </div>

                <Input
                  defaultValue={habit.name}
                  id={`habit-name-${habit.id}`}
                  onBlur={(event) => {
                    void onRenameHabit(habit.id, event.target.value);
                  }}
                  type="text"
                />

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    disabled={index === 0}
                    onClick={() => {
                      void onReorderHabits(
                        reorderHabitList(habits, habit.id, -1)
                      );
                    }}
                    type="button"
                    variant="outline"
                  >
                    Up
                  </Button>
                  <Button
                    disabled={index === habits.length - 1}
                    onClick={() => {
                      void onReorderHabits(
                        reorderHabitList(habits, habit.id, 1)
                      );
                    }}
                    type="button"
                    variant="outline"
                  >
                    Down
                  </Button>
                  <Button
                    onClick={() => {
                      void onArchiveHabit(habit.id);
                    }}
                    type="button"
                    variant="destructive"
                  >
                    Archive
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card
            className="border-border/70 bg-muted/30 py-0 shadow-none"
            size="sm"
          >
            <CardContent className="grid gap-3 py-3">
              <Label htmlFor="new-habit">New habit</Label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  id="new-habit"
                  onChange={(event) => setNewHabitName(event.target.value)}
                  placeholder="Add a new habit"
                  type="text"
                  value={newHabitName}
                />
                <Button
                  onClick={() => {
                    if (!newHabitName.trim()) {
                      return;
                    }

                    void onCreateHabit(newHabitName).then(() => {
                      setNewHabitName("");
                    });
                  }}
                  type="button"
                >
                  Add habit
                </Button>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
