import type { ReactNode } from "react";

import type { KeyboardRowProps } from "@/renderer/shared/types/keyboard-row";
import type { HabitWithStatus } from "@/shared/domain/habit";

export interface HabitListItemStreak {
  bestStreak: number;
  currentStreak: number;
}

export interface HabitListItemProps {
  disabled?: boolean;
  habit: HabitWithStatus;
  inputId?: string;
  keyboardRowProps?: KeyboardRowProps | undefined;
  muted?: boolean;
  onToggle?: ((habitId: number) => void) | undefined;
  readOnly?: boolean;
  showCategory?: boolean | undefined;
  streak?: HabitListItemStreak;
  trailingActions?: ReactNode;
}
