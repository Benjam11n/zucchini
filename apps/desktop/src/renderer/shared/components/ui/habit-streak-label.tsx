import type { HabitListItemStreak } from "@/renderer/shared/components/ui/habit-list-item-types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/renderer/shared/components/ui/tooltip";
import { cn } from "@/renderer/shared/lib/class-names";

export function HabitStreakLabel({
  streak,
}: {
  streak?: HabitListItemStreak | undefined;
}) {
  if (!(streak && streak.currentStreak > 0)) {
    return null;
  }

  const currentUnit = streak.currentStreak === 1 ? "day" : "days";
  const bestUnit = streak.bestStreak === 1 ? "day" : "days";
  const bestStreak = Math.max(streak.bestStreak, streak.currentStreak);
  const isBestStreak = streak.currentStreak >= bestStreak;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            aria-label={`Current streak ${streak.currentStreak} ${currentUnit}. Best streak ${bestStreak} ${bestUnit}.`}
            className={cn(
              "inline-flex shrink-0 cursor-help items-center text-xs font-medium tabular-nums",
              isBestStreak
                ? "text-secondary"
                : "text-primary/85 dark:text-primary"
            )}
          >
            {streak.currentStreak}d
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8}>
          {isBestStreak ? (
            <>
              Best streak: {bestStreak} {bestUnit}. This is your current record.
            </>
          ) : (
            <>
              Current streak: {streak.currentStreak} {currentUnit}. Best streak:{" "}
              {bestStreak} {bestUnit}.
            </>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
