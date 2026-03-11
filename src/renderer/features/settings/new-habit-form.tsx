import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="grid gap-3 rounded-xl border border-dashed border-border/60 p-4">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void handleCreate();
        }}
      >
        <Input
          id="new-habit"
          onChange={(event) => setNewHabitName(event.target.value)}
          placeholder="New habit name..."
          required
          type="text"
          value={newHabitName}
        />
        <Button type="submit">Add</Button>
      </form>
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
    </div>
  );
}
