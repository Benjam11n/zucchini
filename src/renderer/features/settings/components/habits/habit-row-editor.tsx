import { m } from "framer-motion";
import { ArrowDown, ArrowUp, Archive } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  SETTINGS_CATEGORY_COLORS,
  SETTINGS_CATEGORY_TEXT_ON_SELECTED,
} from "@/renderer/features/settings/components/habits/habit-category-colors";
import type { HabitManagementCardProps } from "@/renderer/features/settings/settings.types";
import { hoverLift, microTransition } from "@/renderer/shared/lib/motion";
import { Button } from "@/renderer/shared/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/renderer/shared/ui/collapsible";
import { Input } from "@/renderer/shared/ui/input";
import { Item } from "@/renderer/shared/ui/item";
import { Label } from "@/renderer/shared/ui/label";
import {
  HABIT_CATEGORY_DEFINITIONS,
  HABIT_FREQUENCY_DEFINITIONS,
  HABIT_WEEKDAY_DEFINITIONS,
} from "@/shared/domain/habit";
import type { HabitWeekday, HabitWithStatus } from "@/shared/domain/habit";

import {
  HabitCategorySelector,
  HabitFrequencySelector,
  HabitWeekdaySelector,
} from "./habit-category-selector";
import { reorderHabitList } from "./reorder-habits";

interface HabitRowEditorProps extends Pick<
  HabitManagementCardProps,
  | "onArchiveHabit"
  | "onRenameHabit"
  | "onReorderHabits"
  | "onUpdateHabitCategory"
  | "onUpdateHabitFrequency"
  | "onUpdateHabitWeekdays"
> {
  habit: HabitWithStatus;
  habits: HabitWithStatus[];
  index: number;
  isExpanded: boolean;
  onExpandedChange: (open: boolean) => void;
}

const CATEGORY_LABELS = Object.fromEntries(
  HABIT_CATEGORY_DEFINITIONS.map(({ label, value }) => [value, label])
) as Record<HabitWithStatus["category"], string>;

const FREQUENCY_LABELS = Object.fromEntries(
  HABIT_FREQUENCY_DEFINITIONS.map(({ label, value }) => [value, label])
) as Record<HabitWithStatus["frequency"], string>;

const WEEKDAY_LABELS = Object.fromEntries(
  HABIT_WEEKDAY_DEFINITIONS.map(({ label, value }) => [value, label])
) as Record<HabitWeekday, string>;

const WEEKDAYS: HabitWeekday[] = HABIT_WEEKDAY_DEFINITIONS.map(
  ({ value }) => value
);

function getCadenceSummary(habit: HabitWithStatus): string {
  if (habit.frequency !== "daily") {
    return FREQUENCY_LABELS[habit.frequency];
  }

  const weekdays = habit.selectedWeekdays ?? WEEKDAYS;

  if (weekdays.length === WEEKDAYS.length) {
    return "Daily";
  }

  if (weekdays.join(",") === "1,2,3,4,5") {
    return "Weekdays";
  }

  if (weekdays.join(",") === "0,6") {
    return "Weekends";
  }

  return weekdays.map((weekday) => WEEKDAY_LABELS[weekday]).join(" ");
}

export function HabitRowEditor({
  habit,
  habits,
  index,
  isExpanded,
  onArchiveHabit,
  onExpandedChange,
  onRenameHabit,
  onReorderHabits,
  onUpdateHabitCategory,
  onUpdateHabitFrequency,
  onUpdateHabitWeekdays,
}: HabitRowEditorProps) {
  const [draftName, setDraftName] = useState(habit.name);
  const lastCommittedNameRef = useRef(habit.name);

  useEffect(() => {
    setDraftName(habit.name);
    lastCommittedNameRef.current = habit.name;
  }, [habit.id, habit.name]);

  async function handleRenameCommit(nextName: string): Promise<void> {
    if (nextName === lastCommittedNameRef.current) {
      return;
    }

    lastCommittedNameRef.current = nextName;
    await onRenameHabit(habit.id, nextName);
  }

  return (
    <m.div
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -10 }}
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      layout
      transition={microTransition}
      whileHover={hoverLift}
    >
      <Collapsible open={isExpanded} onOpenChange={onExpandedChange}>
        <Item
          className="flex-col items-stretch gap-0 overflow-hidden rounded-2xl border-border/70 bg-muted/20 p-0"
          variant="outline"
        >
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 p-2.5 sm:p-3">
            <CollapsibleTrigger asChild>
              <button
                aria-label={
                  isExpanded
                    ? `Collapse habit details for ${habit.name}`
                    : `Expand habit details for ${habit.name}`
                }
                className="flex min-w-0 items-center gap-3 rounded-xl px-1 py-1 text-left outline-none transition-colors hover:bg-muted/25 focus-visible:ring-3 focus-visible:ring-ring/50"
                type="button"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {habit.name}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.68rem] font-medium"
                      style={{
                        backgroundColor:
                          SETTINGS_CATEGORY_COLORS[habit.category],
                        borderColor: SETTINGS_CATEGORY_COLORS[habit.category],
                        color:
                          SETTINGS_CATEGORY_TEXT_ON_SELECTED[habit.category],
                      }}
                    >
                      <span
                        className="size-1.5 rounded-full"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${SETTINGS_CATEGORY_TEXT_ON_SELECTED[habit.category]} 50%, transparent)`,
                        }}
                      />
                      {CATEGORY_LABELS[habit.category]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getCadenceSummary(habit)}
                    </span>
                  </div>
                </div>
              </button>
            </CollapsibleTrigger>

            <div className="flex shrink-0 items-center gap-1">
              <Button
                aria-label={`Move ${habit.name} up`}
                disabled={index === 0}
                onClick={() => {
                  void onReorderHabits(reorderHabitList(habits, habit.id, -1));
                }}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <ArrowUp className="size-3.5" />
              </Button>
              <Button
                aria-label={`Move ${habit.name} down`}
                disabled={index === habits.length - 1}
                onClick={() => {
                  void onReorderHabits(reorderHabitList(habits, habit.id, 1));
                }}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <ArrowDown className="size-3.5" />
              </Button>
            </div>
          </div>

          <CollapsibleContent>
            <div className="grid gap-4 border-t border-border/60 px-3 py-3 sm:px-4">
              <div className="grid gap-2">
                <Label
                  className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase"
                  htmlFor={`habit-name-${habit.id}`}
                >
                  Habit name
                </Label>
                <Input
                  className="h-9"
                  id={`habit-name-${habit.id}`}
                  onBlur={(event) => {
                    const nextName = event.target.value;
                    setDraftName(nextName);
                    void handleRenameCommit(nextName);
                  }}
                  onChange={(event) => setDraftName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") {
                      return;
                    }

                    event.preventDefault();
                    const nextName = event.currentTarget.value;
                    setDraftName(nextName);
                    void handleRenameCommit(nextName);
                    event.currentTarget.blur();
                  }}
                  required
                  type="text"
                  value={draftName}
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.95fr)]">
                <div className="grid gap-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Category
                  </Label>
                  <HabitCategorySelector
                    compact
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
                    compact
                    name={`habit-frequency-${habit.id}`}
                    onChange={(frequency) => {
                      void onUpdateHabitFrequency(habit.id, frequency);
                    }}
                    selectedFrequency={habit.frequency}
                  />
                </div>
              </div>

              {habit.frequency === "daily" ? (
                <div className="grid max-w-full gap-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Applies on
                  </Label>
                  <HabitWeekdaySelector
                    compact
                    name={`habit-weekdays-${habit.id}`}
                    onChange={(selectedWeekdays) => {
                      void onUpdateHabitWeekdays(habit.id, selectedWeekdays);
                    }}
                    selectedWeekdays={habit.selectedWeekdays ?? null}
                  />
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
                <p className="text-xs text-muted-foreground">
                  Reorder with the arrows, or archive this habit once it is no
                  longer active.
                </p>
                <Button
                  className="h-8 px-3 text-xs"
                  onClick={() => {
                    void onArchiveHabit(habit.id);
                  }}
                  type="button"
                  variant="destructive"
                >
                  <Archive className="size-3.5" />
                  Archive
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Item>
      </Collapsible>
    </m.div>
  );
}
