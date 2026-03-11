import { CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { HABIT_CATEGORY_UI } from "@/renderer/lib/habit-categories";
import type { HabitWithStatus } from "@/shared/domain/habit";

interface HabitListCardProps {
  title: string;
  icon?: LucideIcon;
  description?: ReactNode;
  progressValue?: number;
  progressLabel?: ReactNode;
  children: ReactNode;
}

export function HabitListCard({
  title,
  icon: Icon,
  description,
  progressValue,
  progressLabel,
  children,
}: HabitListCardProps) {
  return (
    <Card>
      <CardHeader className="gap-2 pb-4">
        <div className="flex items-start justify-between">
          <div className="grid gap-1">
            <div className="flex items-center gap-2">
              {Icon && <Icon className="size-5 text-primary" />}
              <CardTitle className="text-base font-medium">{title}</CardTitle>
            </div>
            {description && (
              <CardDescription className="text-sm">
                {description}
              </CardDescription>
            )}
          </div>
          {progressLabel && (
            <span className="mt-1 shrink-0 text-xs text-muted-foreground tabular-nums">
              {progressLabel}
            </span>
          )}
        </div>
        {progressValue !== undefined && (
          <Progress className="h-1 mt-1" value={progressValue} />
        )}
      </CardHeader>
      <CardContent className="grid gap-6 pt-1">{children}</CardContent>
    </Card>
  );
}

interface HabitListItemProps {
  habit: HabitWithStatus;
  onToggle: (habitId: number) => void;
  showCategory?: boolean;
}

export function HabitListItem({
  habit,
  onToggle,
  showCategory,
}: HabitListItemProps) {
  const ui = HABIT_CATEGORY_UI[habit.category];

  return (
    <label
      htmlFor={`habit-${habit.id}`}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150",
        habit.completed ? "text-muted-foreground/50" : "hover:bg-muted/25"
      )}
    >
      <Checkbox
        checked={habit.completed}
        className="size-4 shrink-0 rounded-full border-2 transition-all duration-200"
        id={`habit-${habit.id}`}
        onCheckedChange={() => onToggle(habit.id)}
        style={
          {
            backgroundColor: habit.completed ? ui.ringColor : undefined,
            borderColor: ui.ringColor,
            color: habit.completed ? "#fff" : undefined,
          } as CSSProperties
        }
      />
      <div className="flex flex-1 items-center gap-2 overflow-hidden">
        <span
          className={cn(
            "truncate text-sm transition-all duration-150",
            habit.completed && "line-through decoration-muted-foreground/30"
          )}
        >
          {habit.name}
        </span>
        {showCategory && (
          <span
            className="shrink-0 text-[0.68rem] tracking-[0.14em] uppercase opacity-80"
            style={{ color: ui.ringColor }}
          >
            {habit.category}
          </span>
        )}
      </div>
      <span
        aria-hidden="true"
        className={cn(
          "flex shrink-0 transition-all duration-150",
          habit.completed
            ? "translate-x-0 scale-100 opacity-100"
            : "translate-x-1 scale-90 opacity-0"
        )}
      >
        <CheckCircle2
          className="size-3.5 opacity-60"
          style={{ color: ui.ringColor }}
        />
      </span>
    </label>
  );
}
