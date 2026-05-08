import type { KeyboardEvent } from "react";

export interface KeyboardRowProps {
  "data-keyboard-row": string;
  onFocus: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  ref: (node: HTMLElement | null) => void;
  tabIndex: number;
}
