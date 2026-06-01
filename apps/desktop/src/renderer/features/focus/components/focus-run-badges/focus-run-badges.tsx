import {
  formatFocusMinutes,
  getFocusMinutesLabel,
} from "@/renderer/features/focus/lib/focus-session-format";
import type { FocusHistorySessionView } from "@/renderer/features/focus/lib/focus-session-groups";
import { Badge } from "@/renderer/shared/components/ui/badge";

interface FocusRunBadgesProps {
  session: FocusHistorySessionView;
}

export function FocusRunBadges({ session }: FocusRunBadgesProps) {
  const totalMinutes = formatFocusMinutes(session.totalDurationSeconds);

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <Badge variant="outline" className="rounded-full border-border/70">
        {getFocusMinutesLabel(totalMinutes)}
      </Badge>
      <Badge variant="secondary" className="rounded-full">
        {session.completedLoopCount} completed loop
        {session.completedLoopCount === 1 ? "" : "s"}
      </Badge>
      {session.hasPartialEntry ? (
        <Badge variant="outline" className="rounded-full border-amber-500/40">
          Interrupted
        </Badge>
      ) : null}
      {session.hasPausedTime ? (
        <Badge
          variant="outline"
          className="rounded-full border-border text-muted-foreground"
        >
          Paused
        </Badge>
      ) : null}
    </div>
  );
}
