import { useCallback, useEffect, useRef, useState } from "react";

interface UseTimedUndoOptions<TValue> {
  isCurrent?: (currentValue: TValue, nextValue: TValue) => boolean;
  timeoutMs: number;
}

export function useTimedUndo<TValue>({
  isCurrent = Object.is,
  timeoutMs,
}: UseTimedUndoOptions<TValue>) {
  const [value, setValue] = useState<TValue | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current === null) {
      return;
    }

    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const clear = useCallback(() => {
    clearTimer();
    setValue(null);
  }, [clearTimer]);

  const show = useCallback(
    (nextValue: TValue) => {
      clearTimer();
      setValue(nextValue);
      timeoutRef.current = window.setTimeout(() => {
        setValue((currentValue) =>
          currentValue !== null && isCurrent(currentValue, nextValue)
            ? null
            : currentValue
        );
        timeoutRef.current = null;
      }, timeoutMs);
    },
    [clearTimer, isCurrent, timeoutMs]
  );

  const consume = useCallback(() => {
    clearTimer();
    const currentValue = value;
    setValue(null);
    return currentValue;
  }, [clearTimer, value]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  return {
    clear,
    consume,
    show,
    value,
  };
}
