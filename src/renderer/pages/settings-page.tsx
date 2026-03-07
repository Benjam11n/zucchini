import { Monitor, MoonStar, SunMedium } from "lucide-react";
import { useState } from "react";

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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { TimeInput } from "@/components/ui/time-input";
import { cn } from "@/lib/utils";
import {
  DEFAULT_HABIT_CATEGORY,
  HABIT_CATEGORY_DEFINITIONS,
  normalizeHabitCategory,
} from "@/shared/domain/habit";
import type { HabitCategory, HabitWithStatus } from "@/shared/domain/habit";
import type { AppSettings, ThemeMode } from "@/shared/domain/settings";

import { RING_COLORS } from "../lib/ring-colors";

const THEME_OPTIONS: {
  icon: React.ElementType;
  label: string;
  value: ThemeMode;
}[] = [
  {
    icon: SunMedium,
    label: "Light",
    value: "light",
  },
  {
    icon: MoonStar,
    label: "Dark",
    value: "dark",
  },
  {
    icon: Monitor,
    label: "System",
    value: "system",
  },
];

const CATEGORY_COLORS: Record<HabitCategory, string> = {
  fitness: RING_COLORS.fitness.base,
  nutrition: RING_COLORS.nutrition.base,
  productivity: RING_COLORS.productivity.base,
};

const CATEGORY_TEXT_ON_SELECTED: Record<HabitCategory, string> = {
  fitness: "#fff",
  nutrition: "#1a2e00",
  productivity: "#fff",
};

interface HabitCategorySelectorProps {
  name: string;
  onChange: (category: HabitCategory) => void;
  selectedCategory: HabitCategory;
}

interface SettingsPageProps {
  habits: HabitWithStatus[];
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
  onCreateHabit: (name: string, category: HabitCategory) => Promise<void>;
  onRenameHabit: (habitId: number, name: string) => Promise<void>;
  onUpdateHabitCategory: (
    habitId: number,
    category: HabitCategory
  ) => Promise<void>;
  onArchiveHabit: (habitId: number) => Promise<void>;
  onReorderHabits: (habits: HabitWithStatus[]) => Promise<void>;
}

interface HabitManagementCardProps {
  habits: HabitWithStatus[];
  onArchiveHabit: (habitId: number) => Promise<void>;
  onCreateHabit: (name: string, category: HabitCategory) => Promise<void>;
  onRenameHabit: (habitId: number, name: string) => Promise<void>;
  onReorderHabits: (habits: HabitWithStatus[]) => Promise<void>;
  onUpdateHabitCategory: (
    habitId: number,
    category: HabitCategory
  ) => Promise<void>;
}

function HabitCategorySelector({
  name,
  onChange,
  selectedCategory,
}: HabitCategorySelectorProps) {
  return (
    <div className="flex gap-2">
      {HABIT_CATEGORY_DEFINITIONS.map((category) => {
        const isSelected = selectedCategory === category.value;
        const color = CATEGORY_COLORS[category.value];

        return (
          <button
            key={category.value}
            id={`${name}-${category.value}`}
            type="button"
            onClick={() => onChange(normalizeHabitCategory(category.value))}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-all",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
              !isSelected &&
                "border-border/60 bg-transparent text-muted-foreground hover:border-border hover:text-foreground"
            )}
            style={
              isSelected
                ? {
                    backgroundColor: color,
                    borderColor: color,
                    color: CATEGORY_TEXT_ON_SELECTED[category.value],
                  }
                : undefined
            }
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{
                backgroundColor: isSelected
                  ? `color-mix(in srgb, ${CATEGORY_TEXT_ON_SELECTED[category.value]} 55%, transparent)`
                  : color,
              }}
            />
            {category.label}
          </button>
        );
      })}
    </div>
  );
}

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

function ReminderSettingsCard({
  onChange,
  settings,
}: Pick<SettingsPageProps, "onChange" | "settings">) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Settings</CardDescription>
        <CardTitle>Reminders</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="reminder-enabled" className="font-normal">
            Enable reminder
          </Label>
          <Switch
            checked={settings.reminderEnabled}
            id="reminder-enabled"
            onCheckedChange={(checked) =>
              onChange({ ...settings, reminderEnabled: checked })
            }
          />
        </div>

        <Separator />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="reminder-time" className="font-normal">
              Time
            </Label>
            <TimeInput
              id="reminder-time"
              onChange={(val) => onChange({ ...settings, reminderTime: val })}
              value={settings.reminderTime}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reminder-timezone" className="font-normal">
              Timezone
            </Label>
            <Input
              id="reminder-timezone"
              onChange={(event) =>
                onChange({ ...settings, timezone: event.target.value })
              }
              type="text"
              value={settings.timezone}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AppearanceSettingsCard({
  onChange,
  settings,
}: Pick<SettingsPageProps, "onChange" | "settings">) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex gap-3">
          {THEME_OPTIONS.map((option) => {
            const isActive = settings.themeMode === option.value;
            const Icon = option.icon;

            return (
              <button
                key={option.value}
                id={`theme-mode-${option.value}`}
                type="button"
                onClick={() =>
                  onChange({ ...settings, themeMode: option.value })
                }
                className={cn(
                  "flex flex-1 flex-col items-center gap-2 rounded-xl border px-4 py-3 text-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                  isActive
                    ? "border-primary bg-primary/8 text-foreground"
                    : "border-border/60 bg-background text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                <Icon className="size-5 opacity-70" />
                {option.label}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function HabitRow({
  habit,
  habits,
  index,
  onArchiveHabit,
  onRenameHabit,
  onReorderHabits,
  onUpdateHabitCategory,
}: {
  habit: HabitWithStatus;
  habits: HabitWithStatus[];
  index: number;
} & Pick<
  HabitManagementCardProps,
  | "onArchiveHabit"
  | "onRenameHabit"
  | "onReorderHabits"
  | "onUpdateHabitCategory"
>) {
  return (
    <div className="grid gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
      <div className="flex items-center gap-3">
        <Input
          className="h-8 text-sm"
          defaultValue={habit.name}
          id={`habit-name-${habit.id}`}
          onBlur={(event) => {
            void onRenameHabit(habit.id, event.target.value);
          }}
          type="text"
        />
        <span className="shrink-0 text-xs text-muted-foreground">
          #{index + 1}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <HabitCategorySelector
          name={`habit-category-${habit.id}`}
          onChange={(category) => {
            void onUpdateHabitCategory(habit.id, category);
          }}
          selectedCategory={habit.category}
        />
        <div className="flex gap-1.5">
          <Button
            className="h-7 px-2 text-xs"
            disabled={index === 0}
            onClick={() => {
              void onReorderHabits(reorderHabitList(habits, habit.id, -1));
            }}
            type="button"
            variant="outline"
          >
            ↑
          </Button>
          <Button
            className="h-7 px-2 text-xs"
            disabled={index === habits.length - 1}
            onClick={() => {
              void onReorderHabits(reorderHabitList(habits, habit.id, 1));
            }}
            type="button"
            variant="outline"
          >
            ↓
          </Button>
          <Button
            className="h-7 px-2 text-xs"
            onClick={() => {
              void onArchiveHabit(habit.id);
            }}
            type="button"
            variant="destructive"
          >
            Archive
          </Button>
        </div>
      </div>
    </div>
  );
}

function NewHabitForm({
  onCreateHabit,
}: Pick<HabitManagementCardProps, "onCreateHabit">) {
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitCategory, setNewHabitCategory] = useState<HabitCategory>(
    DEFAULT_HABIT_CATEGORY
  );

  async function handleCreate(): Promise<void> {
    if (!newHabitName.trim()) {
      return;
    }

    await onCreateHabit(newHabitName, newHabitCategory);
    setNewHabitName("");
    setNewHabitCategory(DEFAULT_HABIT_CATEGORY);
  }

  return (
    <div className="grid gap-3 rounded-xl border border-dashed border-border/60 p-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          id="new-habit"
          onChange={(event) => setNewHabitName(event.target.value)}
          placeholder="New habit name..."
          type="text"
          value={newHabitName}
        />
        <Button
          onClick={() => {
            void handleCreate();
          }}
          type="button"
        >
          Add
        </Button>
      </div>
      <HabitCategorySelector
        name="new-habit-category"
        onChange={setNewHabitCategory}
        selectedCategory={newHabitCategory}
      />
    </div>
  );
}

function HabitManagementCard({
  habits,
  onArchiveHabit,
  onCreateHabit,
  onRenameHabit,
  onReorderHabits,
  onUpdateHabitCategory,
}: HabitManagementCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Habits</CardDescription>
        <CardTitle>Manage</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {habits.map((habit, index) => (
          <HabitRow
            key={habit.id}
            habit={habit}
            habits={habits}
            index={index}
            onArchiveHabit={onArchiveHabit}
            onRenameHabit={onRenameHabit}
            onReorderHabits={onReorderHabits}
            onUpdateHabitCategory={onUpdateHabitCategory}
          />
        ))}

        <NewHabitForm onCreateHabit={onCreateHabit} />
      </CardContent>
    </Card>
  );
}

export function SettingsPage(props: SettingsPageProps) {
  return (
    <div className="grid gap-6">
      <ReminderSettingsCard
        onChange={props.onChange}
        settings={props.settings}
      />
      <AppearanceSettingsCard
        onChange={props.onChange}
        settings={props.settings}
      />
      <HabitManagementCard
        habits={props.habits}
        onArchiveHabit={props.onArchiveHabit}
        onCreateHabit={props.onCreateHabit}
        onRenameHabit={props.onRenameHabit}
        onReorderHabits={props.onReorderHabits}
        onUpdateHabitCategory={props.onUpdateHabitCategory}
      />
    </div>
  );
}
