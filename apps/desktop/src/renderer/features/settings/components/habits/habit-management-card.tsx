import { ListTodo } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/components/ui/card";

import { HabitManagementContent } from "./habit-management-content";
import type { HabitManagementCardProps } from "./habit-management.types";

export function HabitManagementCard({
  habits,
  onArchiveHabit,
  onCreateHabit,
  onRenameHabit,
  onReorderHabits,
  onUnarchiveHabit,
  onUpdateHabitCategory,
  onUpdateHabitFrequency,
  onUpdateHabitWeekdays,
}: HabitManagementCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Habits</CardDescription>
        <div className="flex items-center gap-2">
          <ListTodo className="size-4 text-primary" />
          <CardTitle>Manage</CardTitle>
        </div>
      </CardHeader>
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
          onUpdateHabitWeekdays={onUpdateHabitWeekdays}
        />
      </CardContent>
    </Card>
  );
}
