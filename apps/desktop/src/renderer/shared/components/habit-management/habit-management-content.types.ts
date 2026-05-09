export type HabitFeedback =
  | {
      kind: "auto-sorted";
      message: string;
    }
  | {
      kind: "error";
      message: string;
    }
  | {
      kind: "saved";
      message: string;
    }
  | null;

export interface RecentArchivedHabit {
  frequency: "daily" | "monthly" | "weekly";
  habitId: number;
  habitName: string;
  index: number;
}

export type HabitDragState = {
  draggedHabitId: number;
  overHabitId: number;
  position: "after" | "before";
} | null;
