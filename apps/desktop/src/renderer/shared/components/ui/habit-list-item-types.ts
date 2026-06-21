import type { FocusEvent, KeyboardEvent, MouseEvent, ReactNode } from "react";

import type { HabitWithStatus } from "@/shared/domain/habit";

export interface KeyboardRowProps {
  "data-keyboard-row": string;
  onBlur: (event: FocusEvent<HTMLElement>) => void;
  onFocus: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  onMouseEnter: (event: MouseEvent<HTMLElement>) => void;
  onMouseLeave: (event: MouseEvent<HTMLElement>) => void;
  ref: (node: HTMLElement | null) => void;
  tabIndex: number;
}

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
