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
    <Card className="rounded-[2rem] shadow-sm">
      <CardHeader>
        <CardDescription className="text-xs font-medium tracking-[0.24em] uppercase">
          Checklist
        </CardDescription>
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Today&apos;s habits
        </CardTitle>
      </CardHeader>

      <CardContent className="grid gap-3">
        {habits.map((habit) => (
          <label
            className="flex cursor-pointer items-center gap-4 rounded-2xl border bg-muted/30 px-4 py-4 transition-colors hover:bg-muted/50"
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
