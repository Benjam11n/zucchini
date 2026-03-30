import { useEffect, useRef, useState } from "react";
import type { FocusEvent } from "react";

import { cn } from "@/renderer/shared/lib/class-names";

function sanitizeDurationPart(value: string): string {
  return value.replaceAll(/\D/g, "").slice(0, 2);
}

function padDurationPart(value: number): string {
  return value.toString().padStart(2, "0");
}

function splitDurationSeconds(totalSeconds: number): {
  minutes: number;
  seconds: number;
} {
  const safeSeconds = Math.max(0, Math.min(60 * 60, totalSeconds));

  return {
    minutes: Math.floor(safeSeconds / 60),
    seconds: safeSeconds % 60,
  };
}

export function normalizeDurationInputValue(
  minutesInput: string,
  secondsInput: string,
  minSeconds: number,
  maxSeconds: number
): number | null {
  if (!minutesInput || !secondsInput) {
    return null;
  }

  const parsedMinutes = Number.parseInt(minutesInput, 10);
  const parsedSeconds = Number.parseInt(secondsInput, 10);

  if (Number.isNaN(parsedMinutes) || Number.isNaN(parsedSeconds)) {
    return null;
  }

  const normalizedMinutes = Math.min(60, Math.max(0, parsedMinutes));
  const normalizedSeconds =
    normalizedMinutes === 60 ? 0 : Math.min(59, Math.max(0, parsedSeconds));
  const totalSeconds = normalizedMinutes * 60 + normalizedSeconds;

  return Math.min(maxSeconds, Math.max(minSeconds, totalSeconds));
}

export function DurationInput({
  className,
  disabled = false,
  inputClassName,
  maxSeconds = 60 * 60,
  minSeconds = 1,
  minuteInputClassName,
  minuteAriaLabel,
  minuteInputId,
  onCommit,
  onDraftChange,
  secondAriaLabel,
  secondInputClassName,
  secondInputId,
  separatorClassName,
  valueSeconds,
}: {
  className?: string;
  disabled?: boolean;
  inputClassName?: string;
  maxSeconds?: number;
  minSeconds?: number;
  minuteInputClassName?: string;
  minuteAriaLabel: string;
  minuteInputId?: string;
  onCommit: (valueSeconds: number) => void;
  onDraftChange?: (draft: {
    minutesInput: string;
    secondsInput: string;
  }) => void;
  secondAriaLabel: string;
  secondInputClassName?: string;
  secondInputId?: string;
  separatorClassName?: string;
  valueSeconds: number;
}) {
  const durationParts = splitDurationSeconds(valueSeconds);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [minutesInput, setMinutesInput] = useState(() =>
    padDurationPart(durationParts.minutes)
  );
  const [secondsInput, setSecondsInput] = useState(() =>
    padDurationPart(durationParts.seconds)
  );

  useEffect(() => {
    setMinutesInput(padDurationPart(durationParts.minutes));
    setSecondsInput(padDurationPart(durationParts.seconds));
  }, [durationParts.minutes, durationParts.seconds]);

  const commitValue = () => {
    const normalizedSeconds = normalizeDurationInputValue(
      minutesInput,
      secondsInput,
      minSeconds,
      maxSeconds
    );

    if (normalizedSeconds === null) {
      setMinutesInput(padDurationPart(durationParts.minutes));
      setSecondsInput(padDurationPart(durationParts.seconds));
      return;
    }

    const normalizedParts = splitDurationSeconds(normalizedSeconds);
    setMinutesInput(padDurationPart(normalizedParts.minutes));
    setSecondsInput(padDurationPart(normalizedParts.seconds));

    if (normalizedSeconds !== valueSeconds) {
      onCommit(normalizedSeconds);
    }
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    const nextFocusedElement = event.relatedTarget;
    if (
      nextFocusedElement instanceof HTMLElement &&
      wrapperRef.current?.contains(nextFocusedElement)
    ) {
      return;
    }

    commitValue();
  };

  return (
    <div ref={wrapperRef} className={cn("flex items-center gap-2", className)}>
      <input
        aria-label={minuteAriaLabel}
        className={cn(inputClassName, minuteInputClassName)}
        disabled={disabled}
        id={minuteInputId}
        inputMode="numeric"
        onBlur={handleBlur}
        onChange={(event) => {
          const nextMinutesInput = sanitizeDurationPart(
            event.currentTarget.value
          );
          setMinutesInput(nextMinutesInput);
          onDraftChange?.({
            minutesInput: nextMinutesInput,
            secondsInput,
          });
        }}
        onFocus={(event) => {
          event.currentTarget.select();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            commitValue();
            event.currentTarget.blur();
          }
        }}
        value={minutesInput}
      />
      <span className={separatorClassName}>:</span>
      <input
        aria-label={secondAriaLabel}
        className={cn(inputClassName, secondInputClassName)}
        disabled={disabled}
        id={secondInputId}
        inputMode="numeric"
        onBlur={handleBlur}
        onChange={(event) => {
          const nextSecondsInput = sanitizeDurationPart(
            event.currentTarget.value
          );
          setSecondsInput(nextSecondsInput);
          onDraftChange?.({
            minutesInput,
            secondsInput: nextSecondsInput,
          });
        }}
        onFocus={(event) => {
          event.currentTarget.select();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            commitValue();
            event.currentTarget.blur();
          }
        }}
        value={secondsInput}
      />
    </div>
  );
}
