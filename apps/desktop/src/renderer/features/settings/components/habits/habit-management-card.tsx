import { ListTodo } from "lucide-react";

import { SettingsCardHeader } from "@/renderer/features/settings/components/settings-card-header";
import { HabitManagementContent } from "@/renderer/shared/components/app/habit-management/habit-management-content";
import type { HabitManagementCardProps } from "@/renderer/shared/components/app/habit-management/habit-management.types";
import { Card, CardContent } from "@/renderer/shared/components/ui/card";

export function HabitManagementCard({
  habits,
  onArchiveHabit,
  onCreateHabit,
  onPauseHabit,
  onRenameHabit,
  onReorderHabits,
  onResumeHabit,
  onUnarchiveHabit,
  onUpdateHabitCategory,
  onUpdateHabitFrequency,
  onUpdateHabitTargetCount,
  onUpdateHabitWeekdays,
}: HabitManagementCardProps) {
  const optionalProps = {
    ...(onPauseHabit ? { onPauseHabit } : {}),
    ...(onResumeHabit ? { onResumeHabit } : {}),
  };

  return (
    <Card>
      <SettingsCardHeader
        description="Create, reorder, archive, and restore habits."
        icon={ListTodo}
        title="Manage habits"
      />
      <CardContent className="grid gap-3">
        <HabitManagementContent
          habits={habits}
          onArchiveHabit={onArchiveHabit}
          onCreateHabit={onCreateHabit}
          onRenameHabit={onRenameHabit}
          onReorderHabits={onReorderHabits}
          onUnarchiveHabit={onUnarchiveHabit}
          onUpdateHabitCategory={onUpdateHabitCategory}
          onUpdateHabitFrequency={onUpdateHabitFrequency}
          onUpdateHabitTargetCount={onUpdateHabitTargetCount}
          onUpdateHabitWeekdays={onUpdateHabitWeekdays}
          {...optionalProps}
        />
      </CardContent>
    </Card>
  );
}
