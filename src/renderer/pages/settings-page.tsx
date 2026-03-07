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
import { cn } from "@/lib/utils";

import {
  DEFAULT_HABIT_CATEGORY,
  HABIT_CATEGORY_DEFINITIONS,
  normalizeHabitCategory,
} from "@/shared/domain/habit";
import type { HabitCategory, HabitWithStatus } from "@/shared/domain/habit";
import type { AppSettings, ThemeMode } from "@/shared/domain/settings";
import { RING_COLORS } from "../lib/ring-colors";

// ─── Theme options with inline SVG icons ────────────────────────────────────

const THEME_OPTIONS: {
  icon: React.ReactNode;
  label: string;
  value: ThemeMode;
}[] = [
  {
    icon: (
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className="size-5 opacity-70"
      >
        <path
          fillRule="evenodd"
          d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
          clipRule="evenodd"
        />
      </svg>
    ),
    label: "Light",
    value: "light",
  },
  {
    icon: (
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className="size-5 opacity-70"
      >
        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
      </svg>
    ),
    label: "Dark",
    value: "dark",
  },
  {
    icon: (
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className="size-5 opacity-70"
      >
        <path
          fillRule="evenodd"
          d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
          clipRule="evenodd"
        />
      </svg>
    ),
    label: "System",
    value: "system",
  },
];

// ─── Ring color chip category selector ──────────────────────────────────────

const CATEGORY_COLORS: Record<HabitCategory, string> = {
  fitness: RING_COLORS.fitness.base,
  nutrition: RING_COLORS.nutrition.base,
  productivity: RING_COLORS.productivity.base,
};

// Lime (#A3F900) is near-white — needs dark text when used as a chip background.
// Red and cyan are dark enough that white text reads well.
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
              "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-all",
              "border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
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
              className="size-2 rounded-full shrink-0"
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

// ─── Habit reorder helper ────────────────────────────────────────────────────

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

// ─── Props ───────────────────────────────────────────────────────────────────

interface SettingsPageProps {
  habits: HabitWithStatus[];
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
  onSave: (settings: AppSettings) => Promise<void>;
  onCreateHabit: (name: string, category: HabitCategory) => Promise<void>;
  onRenameHabit: (habitId: number, name: string) => Promise<void>;
  onUpdateHabitCategory: (
    habitId: number,
    category: HabitCategory
  ) => Promise<void>;
  onArchiveHabit: (habitId: number) => Promise<void>;
  onReorderHabits: (habits: HabitWithStatus[]) => Promise<void>;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function SettingsPage({
  habits,
  settings,
  onChange,
  onSave,
  onCreateHabit,
  onRenameHabit,
  onUpdateHabitCategory,
  onArchiveHabit,
  onReorderHabits,
}: SettingsPageProps) {
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitCategory, setNewHabitCategory] = useState<HabitCategory>(
    DEFAULT_HABIT_CATEGORY
  );

  return (
    <div className="grid gap-6">
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
              <Input
                id="reminder-time"
                onChange={(event) =>
                  onChange({ ...settings, reminderTime: event.target.value })
                }
                type="time"
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

          <Button
            className="w-fit"
            onClick={() => {
              void onSave(settings);
            }}
            type="button"
          >
            Save
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex gap-3">
            {THEME_OPTIONS.map((option) => {
              const isActive = settings.themeMode === option.value;
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
                  {option.icon}
                  {option.label}
                </button>
              );
            })}
          </div>
          <Button
            className="w-fit"
            onClick={() => {
              void onSave(settings);
            }}
            type="button"
          >
            Save
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Habits</CardDescription>
          <CardTitle>Manage</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {habits.map((habit, index) => (
            <div
              className="grid gap-3 rounded-xl border border-border/60 bg-muted/20 p-4"
              key={habit.id}
            >
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
                      void onReorderHabits(
                        reorderHabitList(habits, habit.id, -1)
                      );
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
                      void onReorderHabits(
                        reorderHabitList(habits, habit.id, 1)
                      );
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
          ))}

          {/* ── New habit ── */}
          <div className="grid gap-3 rounded-xl border border-dashed border-border/60 p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                id="new-habit"
                onChange={(event) => setNewHabitName(event.target.value)}
                placeholder="New habit name…"
                type="text"
                value={newHabitName}
              />
              <Button
                onClick={() => {
                  if (!newHabitName.trim()) {
                    return;
                  }
                  void onCreateHabit(newHabitName, newHabitCategory).then(
                    () => {
                      setNewHabitName("");
                      setNewHabitCategory(DEFAULT_HABIT_CATEGORY);
                    }
                  );
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
        </CardContent>
      </Card>
    </div>
  );
}
