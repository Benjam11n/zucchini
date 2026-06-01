import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";

import {
  formatSessionRangeLabel,
  formatSessionWindow,
  getRunCounts,
} from "@/renderer/features/focus/lib/focus-run-card-view";
import type { FocusHistorySessionView } from "@/renderer/features/focus/lib/focus-session-groups";
import { Button } from "@/renderer/shared/components/ui/button";
import { cn } from "@/renderer/shared/lib/class-names";

import { FocusRunBadges } from "../focus-run-badges/focus-run-badges";
import { FocusRunDetails } from "../focus-run-details/focus-run-details";
import { FocusRunSummary } from "../focus-run-summary/focus-run-summary";
import { FocusRunTimeline } from "../focus-run-timeline/focus-run-timeline";

interface FocusRunCardProps {
  session: FocusHistorySessionView;
}

export function FocusRunCard({ session }: FocusRunCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const detailsId = useId();
  const { breakCount, pauseCount } = getRunCounts(session);
  const [firstEntry] = session.entries;
  const lastEntry = session.entries.at(-1);

  if (!firstEntry || !lastEntry) {
    return null;
  }

  return (
    <div
      className="space-y-4 rounded-md border border-border/60 bg-muted/20 p-4"
      data-session-date={session.date}
      data-testid="focus-session-card"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {formatSessionRangeLabel(session.startedAt, session.completedAt)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatSessionWindow(session.sessionSpanMinutes)}
          </p>
        </div>
        <FocusRunBadges session={session} />
      </div>

      <FocusRunTimeline session={session} />

      <div className="flex items-center justify-between gap-3 rounded-md border border-border/50 bg-background/60 px-3 py-2">
        <FocusRunSummary
          breakCount={breakCount}
          firstEntry={firstEntry}
          lastEntry={lastEntry}
          pauseCount={pauseCount}
          session={session}
        />

        <Button
          aria-controls={detailsId}
          aria-expanded={isExpanded}
          className="shrink-0"
          onClick={() => setIsExpanded((value) => !value)}
          size="sm"
          type="button"
          variant="outline"
        >
          {isExpanded ? "Hide details" : "Show details"}
          <ChevronDown
            className={cn(
              "size-4 transition-transform",
              isExpanded && "rotate-180"
            )}
          />
        </Button>
      </div>

      {isExpanded ? (
        <FocusRunDetails detailsId={detailsId} session={session} />
      ) : null}
    </div>
  );
}
