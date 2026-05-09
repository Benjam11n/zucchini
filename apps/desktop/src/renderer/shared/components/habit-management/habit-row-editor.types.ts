import type { DragEvent } from "react";

import type { getHabitCategoryPresentation } from "@/renderer/shared/lib/habit-category-presentation";
import type { Habit } from "@/shared/domain/habit";

import type { HabitManagementCardProps } from "./habit-management.types";

export const HABIT_DRAG_DATA_TYPE = "text/plain";

type HabitRowDragState = {
  draggedHabitId: number;
  overHabitId: number;
  position: "after" | "before";
} | null;

export interface HabitRowEditorProps extends Pick<
  HabitManagementCardProps,
  | "onArchiveHabit"
  | "onRenameHabit"
  | "onReorderHabits"
  | "onUpdateHabitCategory"
  | "onUpdateHabitFrequency"
  | "onUpdateHabitTargetCount"
  | "onUpdateHabitWeekdays"
> {
  habit: Habit;
  habits: Habit[];
  index: number;
  isExpanded: boolean;
  dragState: HabitRowDragState;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragStart: () => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onExpandedChange: (open: boolean) => void;
}

export interface HabitNameFieldProps {
  draftName: string;
  habit: Habit;
  nameError: string | null;
  onCommit: (nextName: string) => Promise<void>;
  setDraftName: (nextName: string) => void;
  setNameError: (nextNameError: string | null) => void;
}

export interface HabitRowHeaderProps {
  categoryPresentation: ReturnType<typeof getHabitCategoryPresentation>;
  habit: Habit;
  habits: Habit[];
  index: number;
  isExpanded: boolean;
  onArchiveHabit: HabitManagementCardProps["onArchiveHabit"];
  onDragEnd: () => void;
  onDragStart: () => void;
  onReorderHabits: HabitManagementCardProps["onReorderHabits"];
}

export interface HabitDetailsFormProps extends Pick<
  HabitManagementCardProps,
  | "onUpdateHabitCategory"
  | "onUpdateHabitFrequency"
  | "onUpdateHabitTargetCount"
  | "onUpdateHabitWeekdays"
> {
  draftName: string;
  habit: Habit;
  nameError: string | null;
  onRenameCommit: (nextName: string) => Promise<void>;
  setDraftName: (nextName: string) => void;
  setNameError: (nextNameError: string | null) => void;
}
