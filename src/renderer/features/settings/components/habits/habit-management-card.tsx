import { ListTodo } from "lucide-react";

import type { HabitManagementCardProps } from "@/renderer/features/settings/settings.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/ui/card";

import { HabitManagementContent } from "./habit-management-content";

export function HabitManagementCard({
  habits,
  onArchiveHabit,
  onCreateHabit,
  onRenameHabit,
  onReorderHabits,
  onUpdateHabitCategory,
  onUpdateHabitFrequency,
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
          onUpdateHabitCategory={onUpdateHabitCategory}
          onUpdateHabitFrequency={onUpdateHabitFrequency}
        />
      </CardContent>
    </Card>
  );
}
