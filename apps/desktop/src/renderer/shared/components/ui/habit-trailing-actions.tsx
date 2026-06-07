import type { ReactNode } from "react";

export function HabitTrailingActions({
  trailingActions,
}: {
  trailingActions?: ReactNode;
}) {
  if (!trailingActions) {
    return null;
  }

  return (
    <div className="z-10 flex shrink-0 items-center gap-1">
      {trailingActions}
    </div>
  );
}
