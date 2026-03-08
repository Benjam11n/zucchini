import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  Bell,
  ListTodo,
  Monitor,
  MoonStar,
  Palette,
  SunMedium,
} from "lucide-react";
import { useEffect, useState } from "react";

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
  hoverLift,
  microTransition,
  staggerContainerVariants,
  staggerItemVariants,
  tapPress,
} from "@/renderer/lib/motion";
import {
  DEFAULT_HABIT_CATEGORY,
  DEFAULT_HABIT_FREQUENCY,
  HABIT_CATEGORY_DEFINITIONS,
  HABIT_FREQUENCY_DEFINITIONS,
  normalizeHabitCategory,
  normalizeHabitFrequency,
} from "@/shared/domain/habit";
import type {
  HabitCategory,
  HabitFrequency,
  HabitWithStatus,
} from "@/shared/domain/habit";
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

interface HabitFrequencySelectorProps {
  name: string;
  onChange: (frequency: HabitFrequency) => void;
  selectedFrequency: HabitFrequency;
}

interface SettingsPageProps {
  habits: HabitWithStatus[];
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
  onCreateHabit: (
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency
  ) => Promise<void>;
  onRenameHabit: (habitId: number, name: string) => Promise<void>;
  onUpdateHabitCategory: (
    habitId: number,
    category: HabitCategory
  ) => Promise<void>;
  onUpdateHabitFrequency: (
    habitId: number,
    frequency: HabitFrequency
  ) => Promise<void>;
  onArchiveHabit: (habitId: number) => Promise<void>;
  onReorderHabits: (habits: HabitWithStatus[]) => Promise<void>;
}

interface HabitManagementCardProps {
  habits: HabitWithStatus[];
  onArchiveHabit: (habitId: number) => Promise<void>;
  onCreateHabit: (
    name: string,
    category: HabitCategory,
    frequency: HabitFrequency
  ) => Promise<void>;
  onRenameHabit: (habitId: number, name: string) => Promise<void>;
  onReorderHabits: (habits: HabitWithStatus[]) => Promise<void>;
  onUpdateHabitCategory: (
    habitId: number,
    category: HabitCategory
  ) => Promise<void>;
  onUpdateHabitFrequency: (
    habitId: number,
    frequency: HabitFrequency
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
          <motion.button
            key={category.value}
            animate={{ opacity: 1, scale: 1 }}
            id={`${name}-${category.value}`}
            initial={{ opacity: 0, scale: 0.94 }}
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
            transition={microTransition}
            whileHover={hoverLift}
            whileTap={tapPress}
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
          </motion.button>
        );
      })}
    </div>
  );
}

function HabitFrequencySelector({
  name,
  onChange,
  selectedFrequency,
}: HabitFrequencySelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {HABIT_FREQUENCY_DEFINITIONS.map((frequency) => {
        const isSelected = selectedFrequency === frequency.value;

        return (
          <motion.button
            key={frequency.value}
            animate={{ opacity: 1, scale: 1 }}
            id={`${name}-${frequency.value}`}
            initial={{ opacity: 0, scale: 0.94 }}
            type="button"
            onClick={() => onChange(normalizeHabitFrequency(frequency.value))}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-all",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
              isSelected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/60 bg-transparent text-muted-foreground hover:border-border hover:text-foreground"
            )}
            transition={microTransition}
            whileHover={hoverLift}
            whileTap={tapPress}
          >
            {frequency.label}
          </motion.button>
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
  const [permission, setPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (typeof Notification !== "undefined") {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardDescription>Settings</CardDescription>
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-primary" />
          <CardTitle>Reminders</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="flex flex-col gap-3">
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

          {settings.reminderEnabled && permission !== "granted" && (
            <div className="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <span>Notifications are currently disabled.</span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 border-destructive/50 text-xs hover:bg-destructive/20"
                onClick={() => {
                  void requestPermission();
                }}
              >
                Request
              </Button>
            </div>
          )}
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
        <div className="flex items-center gap-2">
          <Palette className="size-4 text-primary" />
          <CardTitle>Appearance</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex gap-3">
          {THEME_OPTIONS.map((option) => {
            const isActive = settings.themeMode === option.value;
            const Icon = option.icon;

            return (
              <motion.button
                key={option.value}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                id={`theme-mode-${option.value}`}
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
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
                transition={microTransition}
                whileHover={hoverLift}
                whileTap={tapPress}
              >
                <Icon className="size-5 opacity-70" />
                {option.label}
              </motion.button>
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
  onUpdateHabitFrequency,
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
  | "onUpdateHabitFrequency"
>) {
  return (
    <motion.div
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="grid gap-3 rounded-xl border border-border/60 bg-muted/20 p-4"
      exit={{ opacity: 0, scale: 0.96, y: -10 }}
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      layout
      transition={microTransition}
      whileHover={hoverLift}
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

      <div className="grid gap-3">
        <div className="grid gap-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Category
          </Label>
          <HabitCategorySelector
            name={`habit-category-${habit.id}`}
            onChange={(category) => {
              void onUpdateHabitCategory(habit.id, category);
            }}
            selectedCategory={habit.category}
          />
        </div>

        <div className="grid gap-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Frequency
          </Label>
          <HabitFrequencySelector
            name={`habit-frequency-${habit.id}`}
            onChange={(frequency) => {
              void onUpdateHabitFrequency(habit.id, frequency);
            }}
            selectedFrequency={habit.frequency}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
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
    </motion.div>
  );
}

function NewHabitForm({
  onCreateHabit,
}: Pick<HabitManagementCardProps, "onCreateHabit">) {
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitCategory, setNewHabitCategory] = useState<HabitCategory>(
    DEFAULT_HABIT_CATEGORY
  );
  const [newHabitFrequency, setNewHabitFrequency] = useState<HabitFrequency>(
    DEFAULT_HABIT_FREQUENCY
  );

  async function handleCreate(): Promise<void> {
    if (!newHabitName.trim()) {
      return;
    }

    await onCreateHabit(newHabitName, newHabitCategory, newHabitFrequency);
    setNewHabitName("");
    setNewHabitCategory(DEFAULT_HABIT_CATEGORY);
    setNewHabitFrequency(DEFAULT_HABIT_FREQUENCY);
  }

  return (
    <motion.div
      className="grid gap-3 rounded-xl border border-dashed border-border/60 p-4"
      layout
      transition={microTransition}
    >
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
      <HabitFrequencySelector
        name="new-habit-frequency"
        onChange={setNewHabitFrequency}
        selectedFrequency={newHabitFrequency}
      />
    </motion.div>
  );
}

function HabitManagementCard({
  habits,
  onArchiveHabit,
  onCreateHabit,
  onRenameHabit,
  onReorderHabits,
  onUpdateHabitCategory,
  onUpdateHabitFrequency,
}: HabitManagementCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Habits</CardDescription>
        <div className="flex items-center gap-2">
          <ListTodo className="size-4 text-primary" />
          <CardTitle>Manage</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        <LayoutGroup>
          <AnimatePresence initial={false}>
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
                onUpdateHabitFrequency={onUpdateHabitFrequency}
              />
            ))}
          </AnimatePresence>
        </LayoutGroup>

        <NewHabitForm onCreateHabit={onCreateHabit} />
      </CardContent>
    </Card>
  );
}

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
