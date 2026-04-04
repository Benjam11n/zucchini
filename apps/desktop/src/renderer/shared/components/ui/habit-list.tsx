import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { memo } from "react";
import type { CSSProperties, ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/components/ui/card";
import { Checkbox } from "@/renderer/shared/components/ui/checkbox";
import { Progress } from "@/renderer/shared/components/ui/progress";
import { cn } from "@/renderer/shared/lib/class-names";
import {
  getHabitCategoryPresentation,
  useHabitCategoryPreferences,
} from "@/renderer/shared/lib/habit-category-presentation";
import {
  hoverLift,
  microTransition,
  tapPress,
} from "@/renderer/shared/lib/motion";
import type { HabitWithStatus } from "@/shared/domain/habit";

interface HabitListCardProps {
  title: string;
  icon?: LucideIcon;
  description?: ReactNode;
  headerActions?: ReactNode;
  progressValue?: number;
  progressLabel?: ReactNode;
  children: ReactNode;
}

export function HabitListCard({
  title,
  icon: Icon,
  description,
  headerActions,
  progressValue,
  progressLabel,
  children,
}: HabitListCardProps) {
  return (
    <LazyMotion features={domAnimation}>
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
            {headerActions || progressLabel ? (
              <div className="flex shrink-0 flex-col items-end gap-2">
                {headerActions}
                {progressLabel && (
                  <AnimatePresence initial={false} mode="popLayout">
                    <m.span
                      key={String(progressLabel)}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-muted-foreground tabular-nums"
                      exit={{ opacity: 0, y: -8 }}
                      initial={{ opacity: 0, y: 8 }}
                      transition={microTransition}
                    >
                      {progressLabel}
                    </m.span>
                  </AnimatePresence>
                )}
              </div>
            ) : null}
          </div>
          {progressValue !== undefined && (
            <Progress className="h-1 mt-1" value={progressValue} />
          )}
        </CardHeader>
        <CardContent className="grid gap-6 pt-1">{children}</CardContent>
      </Card>
    </LazyMotion>
  );
}

interface HabitListItemProps {
  habit: HabitWithStatus;
  onToggle: (habitId: number) => void;
  showCategory?: boolean;
  trailingActions?: ReactNode;
}

const HABIT_ITEM_ANIMATE = { opacity: 1, scale: 1, x: 0 };
const HABIT_ITEM_INITIAL = { opacity: 0, scale: 0.98, x: -8 };
const HABIT_ITEM_COMPLETION_ANIMATE = { opacity: 1, scale: 1, x: 0 };
const HABIT_ITEM_COMPLETION_EXIT = { opacity: 0, scale: 0.7, x: 6 };
const HABIT_ITEM_COMPLETION_INITIAL = { opacity: 0, scale: 0.7, x: -6 };

function HabitListItemComponent({
  habit,
  onToggle,
  showCategory,
  trailingActions,
}: HabitListItemProps) {
  const categoryPreferences = useHabitCategoryPreferences();
  const presentation = getHabitCategoryPresentation(
    habit.category,
    categoryPreferences
  );
  const hoverProps = habit.completed ? {} : { whileHover: hoverLift };

  return (
    <m.label
      animate={HABIT_ITEM_ANIMATE}
      htmlFor={`habit-${habit.id}`}
      initial={HABIT_ITEM_INITIAL}
      layout
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150",
        habit.completed ? "text-muted-foreground/50" : "hover:bg-muted/25"
      )}
      transition={microTransition}
      {...hoverProps}
      whileTap={tapPress}
    >
      <Checkbox
        checked={habit.completed}
        className="size-4 shrink-0 rounded-full border-2 transition-all duration-200 group-hover:scale-110 group-active:scale-90"
        id={`habit-${habit.id}`}
        onCheckedChange={() => onToggle(habit.id)}
        style={
          {
            backgroundColor: habit.completed ? presentation.color : undefined,
            borderColor: presentation.color,
            color: habit.completed ? "#fff" : undefined,
          } as CSSProperties
        }
      />
      <div className="flex flex-1 items-center gap-2 overflow-hidden">
        <span
          className={cn(
            "truncate text-sm transition-all duration-150",
            habit.completed
              ? "line-through decoration-muted-foreground/30"
              : "group-hover:brightness-125 dark:group-hover:brightness-150"
          )}
        >
          {habit.name}
        </span>
        {showCategory && (
          <span
            className="shrink-0 text-[0.68rem] uppercase tracking-wide opacity-80"
            style={{ color: presentation.color }}
          >
            {presentation.label}
          </span>
        )}
      </div>
      {trailingActions ? (
        <div className="z-10 flex shrink-0 items-center gap-1">
          {trailingActions}
        </div>
      ) : null}
      <AnimatePresence initial={false}>
        {habit.completed ? (
          <m.span
            animate={HABIT_ITEM_COMPLETION_ANIMATE}
            className="flex shrink-0"
            exit={HABIT_ITEM_COMPLETION_EXIT}
            initial={HABIT_ITEM_COMPLETION_INITIAL}
            transition={microTransition}
          >
            <CheckCircle2
              className="size-3.5 opacity-60"
              style={{ color: presentation.color }}
            />
          </m.span>
        ) : null}
      </AnimatePresence>
    </m.label>
  );
}

function areHabitListItemPropsEqual(
  previous: HabitListItemProps,
  next: HabitListItemProps
): boolean {
  return (
    previous.habit.id === next.habit.id &&
    previous.habit.name === next.habit.name &&
    previous.habit.category === next.habit.category &&
    previous.habit.completed === next.habit.completed &&
    previous.onToggle === next.onToggle &&
    previous.showCategory === next.showCategory &&
    previous.trailingActions === next.trailingActions
  );
}

export const HabitListItem = memo(
  HabitListItemComponent,
  areHabitListItemPropsEqual
);
