import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { HABIT_CATEGORY_UI } from "@/renderer/lib/habit-categories";
import { hoverLift, microTransition, tapPress } from "@/renderer/lib/motion";
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
              <CardDescription className="text-sm">{description}</CardDescription>
            )}
          </div>
          {progressLabel && (
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={String(progressLabel)}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-muted-foreground tabular-nums shrink-0 mt-1"
                exit={{ opacity: 0, y: -8 }}
                initial={{ opacity: 0, y: 8 }}
                transition={microTransition}
              >
                {progressLabel}
              </motion.span>
            </AnimatePresence>
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

export function HabitListItem({ habit, onToggle, showCategory }: HabitListItemProps) {
  const ui = HABIT_CATEGORY_UI[habit.category];

  return (
    <motion.label
      animate={{ opacity: 1, scale: 1, x: 0 }}
      htmlFor={`habit-${habit.id}`}
      initial={{ opacity: 0, scale: 0.98, x: -8 }}
      layout
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150",
        habit.completed ? "text-muted-foreground/50" : "hover:bg-muted/25"
      )}
      transition={microTransition}
      whileHover={habit.completed ? undefined : hoverLift}
      whileTap={tapPress}
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
      <AnimatePresence initial={false}>
        {habit.completed ? (
          <motion.span
            animate={{ opacity: 1, scale: 1, x: 0 }}
            className="flex shrink-0"
            exit={{ opacity: 0, scale: 0.7, x: 6 }}
            initial={{ opacity: 0, scale: 0.7, x: -6 }}
            transition={microTransition}
          >
            <CheckCircle2
              className="size-3.5 opacity-60"
              style={{ color: ui.ringColor }}
            />
          </motion.span>
        ) : null}
      </AnimatePresence>
    </motion.label>
  );
}
