import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { KeyboardRowProps } from "@/renderer/shared/types/keyboard-row";

export type TodayKeyboardRowKind = "carryover" | "daily" | "periodic";

export interface TodayKeyboardRow {
  completesOnIncrement?: boolean;
  disabled?: boolean;
  id: string;
  incomplete?: boolean;
  kind: TodayKeyboardRowKind;
  onDecrement?: () => void;
  onIncrement?: () => void;
  onToggle?: () => void;
}

export interface TodayKeyboardHint {
  kind: TodayKeyboardRowKind;
  rowId: string;
}

function isEditableElement(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  if (element.isContentEditable) {
    return true;
  }

  return Boolean(
    element.closest(
      'input, textarea, select, [contenteditable="true"], [role="dialog"], [data-radix-dialog-content]'
    )
  );
}

function shouldAutoFocus(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  const { activeElement } = document;
  return (
    activeElement === null ||
    activeElement === document.body ||
    !isEditableElement(activeElement)
  );
}

export function useTodayKeyboardFlow(rows: TodayKeyboardRow[]) {
  const [optimisticallyCompletedRowIds, setOptimisticallyCompletedRowIds] =
    useState<ReadonlySet<string>>(() => new Set());
  const enabledRows = useMemo(
    () => rows.filter((row) => !row.disabled),
    [rows]
  );
  const enabledRowIds = useMemo(
    () => enabledRows.map((row) => row.id),
    [enabledRows]
  );
  const incompleteRowIds = useMemo(
    () =>
      enabledRows
        .filter(
          (row) => row.incomplete && !optimisticallyCompletedRowIds.has(row.id)
        )
        .map((row) => row.id),
    [enabledRows, optimisticallyCompletedRowIds]
  );
  const rowsById = useMemo(
    () => new Map(enabledRows.map((row) => [row.id, row])),
    [enabledRows]
  );
  const rowElements = useRef(new Map<string, HTMLElement>());
  const hasAutoFocused = useRef(false);
  const [hintRowId, setHintRowId] = useState<string | null>(null);
  const [activeRowId, setActiveRowId] = useState<string | null>(
    enabledRowIds[0] ?? null
  );
  const hint = hintRowId ? rowsById.get(hintRowId) : null;

  useEffect(() => {
    setOptimisticallyCompletedRowIds((currentRowIds) => {
      const nextRowIds = new Set(
        [...currentRowIds].filter((rowId) => {
          const row = rowsById.get(rowId);
          return row?.incomplete;
        })
      );

      return nextRowIds.size === currentRowIds.size
        ? currentRowIds
        : nextRowIds;
    });
  }, [rowsById]);

  useEffect(() => {
    if (enabledRowIds.length === 0) {
      setActiveRowId(null);
      return;
    }

    setActiveRowId((currentRowId) =>
      currentRowId && enabledRowIds.includes(currentRowId)
        ? currentRowId
        : enabledRowIds[0]
    );
    setHintRowId((currentRowId) =>
      currentRowId && enabledRowIds.includes(currentRowId) ? currentRowId : null
    );
  }, [enabledRowIds]);

  const focusRow = useCallback((rowId: string) => {
    setActiveRowId(rowId);
    setHintRowId(rowId);
    rowElements.current.get(rowId)?.focus();
  }, []);

  const markRowCompleted = useCallback((rowId: string) => {
    setOptimisticallyCompletedRowIds(
      (currentRowIds) => new Set([...currentRowIds, rowId])
    );
  }, []);

  const moveFocus = useCallback(
    (currentRowId: string, offset: number) => {
      const currentIndex = enabledRowIds.indexOf(currentRowId);
      if (currentIndex === -1 || enabledRowIds.length === 0) {
        return;
      }

      const nextIndex =
        (currentIndex + offset + enabledRowIds.length) % enabledRowIds.length;
      focusRow(enabledRowIds[nextIndex]);
    },
    [enabledRowIds, focusRow]
  );

  const focusNearestIncompleteRow = useCallback(
    (offset: number) => {
      if (incompleteRowIds.length === 0) {
        return;
      }

      const activeIndex = activeRowId ? enabledRowIds.indexOf(activeRowId) : -1;
      const fallbackIndex = offset > 0 ? -1 : enabledRowIds.length;
      const searchStartIndex = activeIndex === -1 ? fallbackIndex : activeIndex;
      const incompleteRowIdSet = new Set(incompleteRowIds);

      for (let step = 1; step <= enabledRowIds.length; step += 1) {
        const nextIndex =
          (searchStartIndex + offset * step + enabledRowIds.length) %
          enabledRowIds.length;
        const nextRowId = enabledRowIds[nextIndex];

        if (incompleteRowIdSet.has(nextRowId)) {
          focusRow(nextRowId);
          return;
        }
      }
    },
    [activeRowId, enabledRowIds, focusRow, incompleteRowIds]
  );

  useEffect(() => {
    if (
      hasAutoFocused.current ||
      !activeRowId ||
      !shouldAutoFocus() ||
      document.querySelector('[role="dialog"]') ||
      document.querySelector("[data-radix-dialog-content]")
    ) {
      return;
    }

    hasAutoFocused.current = true;
    window.requestAnimationFrame(() => {
      rowElements.current.get(activeRowId)?.focus();
    });
  }, [activeRowId]);

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "n" ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isEditableElement(event.target as Element | null) ||
        document.querySelector('[role="dialog"]') ||
        document.querySelector("[data-radix-dialog-content]")
      ) {
        return;
      }

      event.preventDefault();
      focusNearestIncompleteRow(event.shiftKey ? -1 : 1);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [focusNearestIncompleteRow]);

  const getRowProps = useCallback(
    (rowId: string): KeyboardRowProps | undefined => {
      const row = rowsById.get(rowId);
      if (!row) {
        return undefined;
      }

      return {
        "data-keyboard-row": rowId,
        onBlur: (event) => {
          const nextFocusedElement = event.relatedTarget;
          if (
            nextFocusedElement instanceof HTMLElement &&
            nextFocusedElement.closest("[data-keyboard-row]")
          ) {
            return;
          }

          setHintRowId((currentRowId) =>
            currentRowId === rowId ? null : currentRowId
          );
        },
        onFocus: () => {
          setActiveRowId(rowId);
          setHintRowId(rowId);
        },
        onKeyDown: (event) => {
          if (
            event.key.toLowerCase() === "n" ||
            event.currentTarget !== event.target ||
            isEditableElement(event.target as Element)
          ) {
            return;
          }

          if (event.key === "ArrowDown") {
            event.preventDefault();
            moveFocus(rowId, 1);
            return;
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            moveFocus(rowId, -1);
            return;
          }

          if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            if (row.kind === "periodic") {
              if (row.completesOnIncrement) {
                markRowCompleted(rowId);
              }
              row.onIncrement?.();
              return;
            }
            if (row.incomplete) {
              markRowCompleted(rowId);
            }
            row.onToggle?.();
            return;
          }

          if (row.kind === "periodic" && event.key === "ArrowRight") {
            event.preventDefault();
            if (row.completesOnIncrement) {
              markRowCompleted(rowId);
            }
            row.onIncrement?.();
            return;
          }

          if (row.kind === "periodic" && event.key === "ArrowLeft") {
            event.preventDefault();
            row.onDecrement?.();
          }
        },
        onMouseEnter: () => setHintRowId(rowId),
        onMouseLeave: () => {
          setHintRowId((currentRowId) =>
            currentRowId === rowId && activeRowId !== rowId
              ? null
              : currentRowId
          );
        },
        ref: (node) => {
          if (node) {
            rowElements.current.set(rowId, node);
            return;
          }
          rowElements.current.delete(rowId);
        },
        tabIndex: activeRowId === rowId ? 0 : -1,
      };
    },
    [activeRowId, markRowCompleted, moveFocus, rowsById]
  );

  return {
    getRowProps,
    keyboardHint:
      hint && hintRowId ? { kind: hint.kind, rowId: hintRowId } : null,
    markRowCompleted,
  };
}
