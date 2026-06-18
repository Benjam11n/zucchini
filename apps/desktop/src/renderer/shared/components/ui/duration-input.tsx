import { useRef, useState } from "react";
import type { FocusEvent } from "react";

import { normalizeDurationInputValue } from "@/renderer/shared/components/ui/duration-input-utils";
import { cn } from "@/renderer/shared/lib/class-names";

function sanitizeDurationPart(value: string): string {
  return value.replaceAll(/\D/gu, "").slice(0, 2);
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

export function DurationInput({
  className,
  disabled = false,
  inputClassName,
  maxSeconds = 60 * 60,
  minSeconds = 1,
  minuteInputClassName,
  minuteWrapperClassName,
  minuteAriaLabel,
  minuteInputId,
  onCommit,
  onDraftChange,
  secondAriaLabel,
  secondInputClassName,
  secondInputId,
  secondWrapperClassName,
  separatorClassName,
  valueSeconds,
}: {
  className?: string;
  disabled?: boolean;
  inputClassName?: string;
  maxSeconds?: number;
  minSeconds?: number;
  minuteInputClassName?: string;
  minuteWrapperClassName?: string;
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
  secondWrapperClassName?: string;
  separatorClassName?: string;
  valueSeconds: number;
}) {
  const durationParts = splitDurationSeconds(valueSeconds);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState(() => ({
    minutesInput: padDurationPart(durationParts.minutes),
    secondsInput: padDurationPart(durationParts.seconds),
    sourceSeconds: valueSeconds,
  }));
  const activeDraft =
    draft.sourceSeconds === valueSeconds
      ? draft
      : {
          minutesInput: padDurationPart(durationParts.minutes),
          secondsInput: padDurationPart(durationParts.seconds),
          sourceSeconds: valueSeconds,
        };
  const { minutesInput, secondsInput } = activeDraft;

  const commitValue = () => {
    const normalizedSeconds = normalizeDurationInputValue(
      minutesInput,
      secondsInput,
      minSeconds,
      maxSeconds
    );

    if (normalizedSeconds === null) {
      setDraft({
        minutesInput: padDurationPart(durationParts.minutes),
        secondsInput: padDurationPart(durationParts.seconds),
        sourceSeconds: valueSeconds,
      });
      return;
    }

    const normalizedParts = splitDurationSeconds(normalizedSeconds);
    setDraft({
      minutesInput: padDurationPart(normalizedParts.minutes),
      secondsInput: padDurationPart(normalizedParts.seconds),
      sourceSeconds: normalizedSeconds,
    });

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
      <div className={minuteWrapperClassName}>
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
            setDraft({
              ...activeDraft,
              minutesInput: nextMinutesInput,
            });
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
      </div>
      <span className={separatorClassName}>:</span>
      <div className={secondWrapperClassName}>
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
            setDraft({
              ...activeDraft,
              secondsInput: nextSecondsInput,
            });
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
    </div>
  );
}
