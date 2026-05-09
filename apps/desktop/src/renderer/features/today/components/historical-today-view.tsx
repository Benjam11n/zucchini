import { ArrowRight, ListChecks } from "lucide-react";
import { useMemo } from "react";

import { splitTodayHabits } from "@/renderer/features/today/lib/split-today-habits";
import { HISTORY_STATUS_UI } from "@/renderer/shared/components/history-status/history-status-ui";
import { Badge } from "@/renderer/shared/components/ui/badge";
import { Button } from "@/renderer/shared/components/ui/button";
import {
  getActivityBadgeLabel,
  getActivityStatus,
} from "@/renderer/shared/lib/history-summary";
import type { HistoryDay } from "@/shared/domain/history";
import { formatDateKey } from "@/shared/utils/date";

import { HabitChecklist } from "./habit-checklist";
import { LongerHabitChecklist } from "./longer-habit-checklist";

interface HistoricalTodayViewProps {
  day: HistoryDay;
  onReturnToToday: () => void;
}

export function HistoricalTodayView({
  day,
  onReturnToToday,
}: HistoricalTodayViewProps) {
  const { completedCount, dailyHabits, periodicHabits } = useMemo(
    () => splitTodayHabits(day.habits),
    [day.habits]
  );
  const title = formatDateKey(day.date, {
    day: "numeric",
    month: "short",
    weekday: "short",
  });
  const activityStatus = getActivityStatus(day.summary, false);
  const activityLabel = getActivityBadgeLabel(day.summary, false);

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <Badge
          className={HISTORY_STATUS_UI[activityStatus].badgeClassName}
          variant="outline"
        >
          {activityLabel}
        </Badge>
        <Button
          onClick={onReturnToToday}
          size="sm"
          type="button"
          variant="ghost"
        >
          Today
          <ArrowRight className="size-4" />
        </Button>
      </div>
      <HabitChecklist
        completedCount={completedCount}
        emptyMessage="No daily habits were tracked on this day."
        habits={dailyHabits}
        icon={ListChecks}
        readOnly
        title={title}
      />

      {periodicHabits.length > 0 || (day.focusQuotaGoals ?? []).length > 0 ? (
        <LongerHabitChecklist
          dateKey={day.date}
          focusQuotaGoals={day.focusQuotaGoals ?? []}
          habits={periodicHabits}
          readOnly
        />
      ) : null}
    </div>
  );
}
