import { Clock3 } from "lucide-react";

import type {
  FocusSessionsPhase,
  FocusTodaySummary,
} from "@/renderer/features/focus/focus.types";
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

export function getFocusTodaySummary(
  sessions: FocusSession[],
  todayDate: string
): FocusTodaySummary {
  const todaySessions = sessions.filter(
    (session) => session.completedDate === todayDate
  );

  return {
    completedCount: todaySessions.length,
    totalMinutes: todaySessions.reduce(
      (total, session) => total + session.durationSeconds / 60,
      0
    ),
  };
}

function formatCompletedAt(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

interface FocusSessionListProps {
  phase: FocusSessionsPhase;
  sessions: FocusSession[];
  sessionsLoadError: Error | null;
  todayDate: string;
  onRetryLoad: () => Promise<void>;
}

export function FocusSessionList({
  phase,
  sessions,
  sessionsLoadError,
  todayDate,
  onRetryLoad,
}: FocusSessionListProps) {
  const todaySummary = getFocusTodaySummary(sessions, todayDate);

  return (
    <Card className="border-border/70 bg-card/95">
      <CardHeader className="gap-3">
        <div className="space-y-1">
          <CardDescription>Recent focus</CardDescription>
          <CardTitle>Completed sessions</CardTitle>
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span>{todaySummary.completedCount} sessions today</span>
          <span>{todaySummary.totalMinutes} focused minutes</span>
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
          <div className="space-y-3 rounded-2xl border border-destructive/25 bg-destructive/8 p-4">
            <p className="text-sm text-destructive">
              {sessionsLoadError.message}
            </p>
            <Button
              onClick={() => void onRetryLoad()}
              size="sm"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        ) : null}

        {phase !== "loading" && !sessionsLoadError && sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No completed focus sessions yet.
          </p>
        ) : null}

        {sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {formatCompletedAt(session.completedAt)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Completed focus block
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock3 className="size-4" />
                  <span>{Math.round(session.durationSeconds / 60)} min</span>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
