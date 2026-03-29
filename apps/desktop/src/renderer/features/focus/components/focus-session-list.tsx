import type {
  PersistedFocusTimerState,
  FocusSessionsPhase,
  FocusTodaySummary,
} from "@/renderer/features/focus/focus.types";
import {
  formatFocusMinutes,
  getFocusMinutesLabel,
} from "@/renderer/features/focus/lib/focus-session-format";
import { buildFocusHistorySessions } from "@/renderer/features/focus/lib/focus-session-groups";
import { Button } from "@/renderer/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/ui/card";
import { Spinner } from "@/renderer/shared/ui/spinner";
import type { FocusSession } from "@/shared/domain/focus-session";

import { FocusRunList } from "./focus-run-list";

export function getFocusTodaySummary(
  sessions: FocusSession[],
  todayDate: string
): FocusTodaySummary {
  const todaySessions = sessions.filter(
    (session) => session.completedDate === todayDate
  );

  return {
    completedCount: todaySessions.filter(
      (session) => session.entryKind === "completed"
    ).length,
    totalMinutes: formatFocusMinutes(
      todaySessions.reduce(
        (totalSeconds, session) => totalSeconds + session.durationSeconds,
        0
      )
    ),
  };
}

interface FocusSessionListProps {
  phase: FocusSessionsPhase;
  sessions: FocusSession[];
  sessionsLoadError: Error | null;
  timerState: PersistedFocusTimerState;
  todayDate: string;
  onRetryLoad: () => Promise<void>;
}

export function FocusSessionList({
  phase,
  sessions,
  sessionsLoadError,
  timerState,
  todayDate,
  onRetryLoad,
}: FocusSessionListProps) {
  const todaySummary = getFocusTodaySummary(sessions, todayDate);
  const historySessions = buildFocusHistorySessions(sessions, timerState);

  return (
    <Card className="border-border/70 bg-card/95">
      <CardHeader className="gap-3">
        <div className="space-y-1">
          <CardDescription>Recent focus</CardDescription>
          <CardTitle>Recent focus sessions</CardTitle>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span>
            {todaySummary.completedCount} completed loop
            {todaySummary.completedCount === 1 ? "" : "s"} today
          </span>
          <span>{getFocusMinutesLabel(todaySummary.totalMinutes)}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {phase === "loading" && sessions.length === 0 ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Spinner className="size-4 text-primary/70" />
            Loading recent focus sessions...
          </div>
        ) : null}

        {sessionsLoadError && sessions.length === 0 ? (
          <div className="space-y-3 rounded-xl border border-destructive/25 bg-destructive/8 p-4">
            <p className="text-sm text-destructive">
              {sessionsLoadError.message}
            </p>
            <Button onClick={onRetryLoad} size="sm" variant="outline">
              Retry
            </Button>
          </div>
        ) : null}

        {phase !== "loading" && !sessionsLoadError && sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No completed focus sessions yet.
          </p>
        ) : null}

        {sessions.length > 0 && historySessions.length > 0 ? (
          <FocusRunList sessions={historySessions} />
        ) : null}
      </CardContent>
    </Card>
  );
}
