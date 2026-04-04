import { Clock3, PauseCircle } from "lucide-react";

import { formatFocusMinutes } from "@/renderer/features/focus/lib/focus-session-format";
import type { FocusSessionEntryKind } from "@/shared/domain/focus-session";

function formatEntryRange(startedAt: string, completedAt: string): string {
  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${formatter.format(new Date(startedAt))} - ${formatter.format(new Date(completedAt))}`;
}

interface FocusRunEntryRowProps {
  completedAt: string;
  durationSeconds: number;
  entryKind: FocusSessionEntryKind;
  idleGap: number;
  index: number;
  startedAt: string;
}

export function FocusRunEntryRow({
  completedAt,
  durationSeconds,
  entryKind,
  idleGap,
  index,
  startedAt,
}: FocusRunEntryRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border/50 bg-background/70 px-3 py-2">
      <div className="flex items-center gap-2 text-sm text-foreground">
        <Clock3 className="size-4 text-primary/80" />
        <span>{formatEntryRange(startedAt, completedAt)}</span>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          {entryKind === "partial" ? "Partial · " : ""}
          {formatFocusMinutes(durationSeconds)} min
        </span>
        {index > 0 && idleGap > 0 ? (
          <span className="inline-flex items-center gap-1">
            <PauseCircle className="size-3.5" />
            {idleGap}m gap
          </span>
        ) : null}
      </div>
    </div>
  );
}
