import type { FocusHistorySessionView } from "@/renderer/features/focus/lib/focus-session-groups";

import { FocusRunCard } from "./focus-run-card";

interface FocusRunListProps {
  sessions: FocusHistorySessionView[];
}

export function FocusRunList({ sessions }: FocusRunListProps) {
  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <FocusRunCard key={session.sessionId} session={session} />
      ))}
    </div>
  );
}
