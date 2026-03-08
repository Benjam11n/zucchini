import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hoverLift, microTransition } from "@/renderer/lib/motion";
import type { HabitWithStatus } from "@/shared/domain/habit";

import { reorderHabitList } from "./reorder-habits";
import { HabitCategorySelector, HabitFrequencySelector } from "./selectors";
import type { HabitManagementCardProps } from "./types";

interface HabitRowEditorProps extends Pick<
  HabitManagementCardProps,
  | "onArchiveHabit"
  | "onRenameHabit"
  | "onReorderHabits"
  | "onUpdateHabitCategory"
  | "onUpdateHabitFrequency"
> {
  habit: HabitWithStatus;
  habits: HabitWithStatus[];
  index: number;
}

export function HabitRowEditor({
  habit,
  habits,
  index,
  onArchiveHabit,
  onRenameHabit,
  onReorderHabits,
  onUpdateHabitCategory,
  onUpdateHabitFrequency,
}: HabitRowEditorProps) {
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
