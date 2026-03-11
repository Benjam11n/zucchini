import { m } from "framer-motion";
import { useState } from "react";

import { microTransition } from "@/renderer/shared/lib/motion";
import { Button } from "@/renderer/shared/ui/button";
import { Input } from "@/renderer/shared/ui/input";
import { Label } from "@/renderer/shared/ui/label";
import {
  DEFAULT_HABIT_CATEGORY,
  DEFAULT_HABIT_FREQUENCY,
} from "@/shared/domain/habit";
import type { HabitCategory, HabitFrequency } from "@/shared/domain/habit";

import { HabitCategorySelector, HabitFrequencySelector } from "./selectors";
import type { HabitManagementCardProps } from "./types";

export function NewHabitForm({
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
    <m.div
      className="grid w-full gap-4 self-start rounded-2xl border border-dashed border-border/60 bg-muted/15 p-4 sm:max-w-2xl"
      layout
      transition={microTransition}
    >
      <div className="space-y-1">
        <p className="text-sm font-medium">Add a habit</p>
        <p className="text-xs text-muted-foreground">
          Keep the setup lightweight, then fine-tune it below.
        </p>
      </div>
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void handleCreate();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="grid gap-2">
            <Label
              className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase"
              htmlFor="new-habit"
            >
              Name
            </Label>
            <Input
              className="h-9"
              id="new-habit"
              onChange={(event) => setNewHabitName(event.target.value)}
              placeholder="Drink water"
              required
              type="text"
              value={newHabitName}
            />
          </div>
          <Button className="h-9 px-4" type="submit">
            Add habit
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Category
            </Label>
            <HabitCategorySelector
              className="gap-1.5"
              compact
              name="new-habit-category"
              onChange={setNewHabitCategory}
              selectedCategory={newHabitCategory}
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Frequency
            </Label>
            <HabitFrequencySelector
              className="gap-1.5"
              compact
              name="new-habit-frequency"
              onChange={setNewHabitFrequency}
              selectedFrequency={newHabitFrequency}
            />
          </div>
        </div>
      </form>
    </m.div>
  );
}
