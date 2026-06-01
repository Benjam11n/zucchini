import { getHabitCadenceSummary } from "@/renderer/shared/components/app/habit-management/lib/habit-cadence-summary";
import { getHabitCategoryPresentation } from "@/renderer/shared/lib/habit-category-presentation";
import type { BackupRestorePreview } from "@/shared/contracts/api/desktop-api";

import { toRestoreSnapshotHabit } from "../../../lib/data-management-format";

interface RestoreHabitSnapshotProps {
  preview: BackupRestorePreview;
}

export function RestoreHabitSnapshot({ preview }: RestoreHabitSnapshotProps) {
  if (preview.habits.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 px-4 py-4 text-center text-sm text-muted-foreground">
        No active habits in this backup.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/70 bg-muted/15 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Habits in backup</p>
        <span className="text-xs text-muted-foreground">
          {preview.habits.length}
          {preview.habitPreviewTotalCount > preview.habits.length
            ? ` of ${preview.habitPreviewTotalCount}`
            : ""}
        </span>
      </div>

      <div className="grid max-h-40 gap-1 overflow-y-auto pr-1">
        {preview.habits.map((habitPreview) => {
          const habit = toRestoreSnapshotHabit(habitPreview);
          const presentation = getHabitCategoryPresentation(habit.category);

          return (
            <div
              className="flex min-w-0 items-center gap-3 rounded-md px-2 py-1.5 text-sm"
              key={habit.id}
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: presentation.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-foreground">{habit.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {presentation.label} · {getHabitCadenceSummary(habit)}
                </p>
              </div>
              {habit.pausedAt ? (
                <span className="shrink-0 rounded-md border border-border/70 px-2 py-1 text-xs text-muted-foreground">
                  Paused
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
