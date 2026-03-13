import type { FocusRunView } from "@/renderer/features/focus/lib/focus-session-groups";

import { FocusRunCard } from "./focus-run-card";

interface FocusRunListProps {
  runs: FocusRunView[];
}

export function FocusRunList({ runs }: FocusRunListProps) {
  return (
    <div className="space-y-3">
      {runs.map((run) => (
        <FocusRunCard key={run.runId} run={run} />
      ))}
    </div>
  );
}
