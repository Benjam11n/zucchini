import type { FocusEvent, KeyboardEvent, MouseEvent } from "react";

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
