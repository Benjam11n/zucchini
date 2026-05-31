import type { FocusHistorySessionView } from "@/renderer/features/focus/lib/focus-session-groups";

import { FocusRunEntryRow } from "./focus-run-entry-row";

interface FocusRunDetailsProps {
  detailsId: string;
  session: FocusHistorySessionView;
}

export function FocusRunDetails({ detailsId, session }: FocusRunDetailsProps) {
  return (
    <div className="grid gap-2" id={detailsId}>
      {session.entries.map((entry, index) => (
        <FocusRunEntryRow
          key={entry.id}
          completedAt={entry.completedAt}
          durationSeconds={entry.durationSeconds}
          entryKind={entry.entryKind}
          idleGap={session.idleGapMinutesBetweenEntries[index - 1] ?? 0}
          index={index}
          startedAt={entry.startedAt}
        />
      ))}
    </div>
  );
}
