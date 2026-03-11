import { AnimatePresence, LayoutGroup } from "framer-motion";
import { ListTodo } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { HabitRowEditor } from "./habit-row-editor";
import { NewHabitForm } from "./new-habit-form";
import type { HabitManagementCardProps } from "./types";

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
        <LayoutGroup>
          <AnimatePresence initial={false}>
            {habits.map((habit, index) => (
              <HabitRowEditor
                key={habit.id}
                habit={habit}
                habits={habits}
                index={index}
                onArchiveHabit={onArchiveHabit}
                onRenameHabit={onRenameHabit}
                onReorderHabits={onReorderHabits}
                onUpdateHabitCategory={onUpdateHabitCategory}
                onUpdateHabitFrequency={onUpdateHabitFrequency}
              />
            ))}
          </AnimatePresence>
        </LayoutGroup>

        <NewHabitForm onCreateHabit={onCreateHabit} />
      </CardContent>
    </Card>
  );
}
