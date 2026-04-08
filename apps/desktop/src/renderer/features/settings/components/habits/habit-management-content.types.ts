export type HabitFeedback =
  | {
      kind: "archived";
      habitId: number;
      habitName: string;
    }
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

export type HabitDragState = {
  draggedHabitId: number;
  overHabitId: number;
  position: "after" | "before";
} | null;
