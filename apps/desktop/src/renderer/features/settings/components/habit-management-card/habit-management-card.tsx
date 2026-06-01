import { ListTodo } from "lucide-react";

import { SettingsCardHeader } from "@/renderer/features/settings/components/settings-card-header";
import { HabitManagementContent } from "@/renderer/shared/components/app/habit-management/habit-management-content";
import { Card, CardContent } from "@/renderer/shared/components/ui/card";
import type { HabitManagementActions } from "@/renderer/shared/types/habit-actions";
import type { Habit } from "@/shared/domain/habit";

interface HabitManagementCardProps {
  actions: HabitManagementActions;
  habits: Habit[];
}

export function HabitManagementCard({
  actions,
  habits,
}: HabitManagementCardProps) {
  return (
    <Card>
      <SettingsCardHeader
        description="Create, reorder, archive, and restore habits."
        icon={ListTodo}
        title="Manage habits"
      />
      <CardContent className="grid gap-3">
        <HabitManagementContent actions={actions} habits={habits} />
      </CardContent>
    </Card>
  );
}
