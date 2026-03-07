import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

import type { HabitWithStatus } from "../../shared/domain/habit";

interface HabitChecklistProps {
  habits: HabitWithStatus[];
  onToggleHabit: (habitId: number) => void;
}

export function HabitChecklist({ habits, onToggleHabit }: HabitChecklistProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Checklist</CardDescription>
        <CardTitle>Today&apos;s habits</CardTitle>
      </CardHeader>

      <CardContent className="grid gap-3">
        {habits.map((habit) => (
          <label
            className="flex cursor-pointer items-center gap-4 border px-4 py-4"
            key={habit.id}
          >
            <Checkbox
              checked={habit.completed}
              onCheckedChange={() => onToggleHabit(habit.id)}
            />
            <span className="text-sm font-medium sm:text-base">
              {habit.name}
            </span>
          </label>
        ))}
      </CardContent>
    </Card>
  );
}
