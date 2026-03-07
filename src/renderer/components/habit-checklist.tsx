import { CheckCircle2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

import type { HabitWithStatus } from "../../shared/domain/habit";

interface HabitChecklistProps {
  habits: HabitWithStatus[];
  onToggleHabit: (habitId: number) => void;
  completedCount: number;
}

export function HabitChecklist({
  habits,
  onToggleHabit,
  completedCount,
}: HabitChecklistProps) {
  const totalHabits = habits.length;

  return (
    <Card className="border-white/70 bg-white/85 shadow-[0_20px_60px_-44px_rgba(21,84,54,0.5)] dark:border-white/10 dark:bg-white/6 dark:shadow-[0_24px_64px_-40px_rgba(0,0,0,0.8)]">
      <CardHeader className="gap-2 border-none pb-0">
        <CardDescription className="text-[0.72rem] font-semibold tracking-[0.2em] uppercase text-foreground/55">
          Checklist
        </CardDescription>
        <CardTitle>Today&apos;s habits</CardTitle>
        <CardDescription className="text-sm font-medium text-muted-foreground">
          {totalHabits === 0
            ? "Nothing scheduled yet."
            : `${completedCount} of ${totalHabits} done`}
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-3">
        {totalHabits === 0 ? (
          <Card
            className="border-dashed border-emerald-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(240,252,243,0.92)_100%)] py-0 shadow-none dark:border-emerald-900/60 dark:bg-[linear-gradient(180deg,rgba(24,35,30,0.96)_0%,rgba(20,43,32,0.92)_100%)]"
            size="sm"
          >
            <CardContent className="px-5 py-8 text-left">
              <p className="text-lg font-semibold text-foreground">
                No habits for today yet
              </p>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Add habits from Settings to build a checklist worth protecting.
              </p>
              <p className="mt-4 text-xs font-semibold tracking-[0.18em] uppercase text-primary/80">
                Open Settings to get started
              </p>
            </CardContent>
          </Card>
        ) : null}

        {habits.map((habit) => (
          <Card
            asChild
            className={cn(
              "min-h-16 flex-row items-center gap-0 transition-all duration-200 ease-out",
              habit.completed
                ? "border-emerald-100 bg-emerald-50/80 shadow-none dark:border-emerald-900/60 dark:bg-emerald-500/10"
                : "border-emerald-200/70 bg-white shadow-[0_16px_30px_-28px_rgba(31,84,54,0.4)] hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-[0_18px_36px_-26px_rgba(31,84,54,0.42)] dark:border-white/10 dark:bg-white/5 dark:shadow-[0_20px_36px_-26px_rgba(0,0,0,0.72)] dark:hover:border-emerald-700/60"
            )}
            key={habit.id}
          >
            <label
              className="flex cursor-pointer items-center gap-4 px-4 py-4"
              htmlFor={`habit-${habit.id}`}
            >
              <Checkbox
                checked={habit.completed}
                className="size-6 border-2 border-emerald-200 data-checked:border-emerald-500 data-checked:bg-emerald-500"
                id={`habit-${habit.id}`}
                onCheckedChange={() => onToggleHabit(habit.id)}
              />
              <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                <div className="min-w-0">
                  <span
                    className={cn(
                      "block truncate text-base font-semibold transition-colors duration-200",
                      habit.completed
                        ? "text-emerald-900/55 dark:text-emerald-100/65"
                        : "text-emerald-950 dark:text-foreground"
                    )}
                  >
                    {habit.name}
                  </span>
                  <span className="mt-1 block text-sm text-emerald-900/55 dark:text-muted-foreground">
                    {habit.completed
                      ? "Done for today"
                      : "Tap to mark complete"}
                  </span>
                </div>

                <span
                  className={cn(
                    "flex items-center gap-2 text-sm font-semibold transition-colors duration-200",
                    habit.completed
                      ? "text-emerald-700/85 dark:text-emerald-300/85"
                      : "text-emerald-700/0"
                  )}
                >
                  <CheckCircle2 className="size-4" />
                  Done
                </span>
              </div>
            </label>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
