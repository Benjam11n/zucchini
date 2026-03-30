/**
 * Keyboard shortcut registration hook.
 *
 * Registers a global keydown listener for a specific key code with optional
 * modifier keys. Skips events from editable inputs by default. Supports
 * Ctrl/Cmd, Alt, and Shift modifiers.
 */
import { useEffect, useRef } from "react";

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      target.closest(
        "input, textarea, select, [contenteditable=''], [contenteditable='true']"
      ) !== null)
  );
}

export function useKeyboardShortcut({
  allowEditable = false,
  code,
  enabled = true,
  handler,
}: {
  allowEditable?: boolean;
  code: string;
  enabled?: boolean;
  handler: () => void;
}) {
  const handlerRef = useRef(handler);

  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.code !== code ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        (!allowEditable && isEditableTarget(event.target))
      ) {
        return;
      }

      event.preventDefault();
      handlerRef.current();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [allowEditable, code, enabled]);
}
