import type { FocusTodaySummary } from "@/renderer/features/focus/focus.types";
import { formatFocusMinutes } from "@/renderer/features/focus/lib/focus-session-format";
import type { FocusSession } from "@/shared/domain/focus-session";

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
