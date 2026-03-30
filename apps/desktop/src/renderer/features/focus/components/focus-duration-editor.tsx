import { useRef } from "react";
import type { FocusEvent } from "react";

import type { PersistedFocusTimerState } from "@/renderer/features/focus/focus.types";
import { formatTimerLabel } from "@/renderer/features/focus/lib/focus-timer-state";
import { sanitizeTimerPart } from "@/renderer/features/focus/lib/focus-timer-view-model";
import { clampFocusDurationMs } from "@/renderer/features/focus/lib/focus-timer.constants";
import { normalizeDurationInputValue } from "@/renderer/shared/components/ui/duration-input";
import { MS_PER_SECOND } from "@/renderer/shared/lib/time";

interface FocusDurationEditorProps {
  canEditDuration: boolean;
  durationDraft: { minutesInput: string; secondsInput: string };
  timerDisplayColorClass: string;
  timerState: PersistedFocusTimerState;
  onDurationChange: (focusDurationMs: number) => void;
  onDurationDraftChange: (
    nextDraft:
      | { minutesInput: string; secondsInput: string }
      | ((currentDraft: { minutesInput: string; secondsInput: string }) => {
          minutesInput: string;
          secondsInput: string;
        })
  ) => void;
}

export function FocusDurationEditor({
  canEditDuration,
  durationDraft,
  timerDisplayColorClass,
  timerState,
  onDurationChange,
  onDurationDraftChange,
}: FocusDurationEditorProps) {
  const durationEditorRef = useRef<HTMLDivElement | null>(null);

  const commitDuration = (durationSeconds: number) => {
    const durationMs = clampFocusDurationMs(durationSeconds * MS_PER_SECOND);

    if (canEditDuration) {
      onDurationChange(durationMs);
    }

    return durationMs;
  };

  const commitDraftDuration = () => {
    const nextDurationSeconds = normalizeDurationInputValue(
      durationDraft.minutesInput,
      durationDraft.secondsInput,
      1,
      60 * 60
    );

    return commitDuration(
      nextDurationSeconds === null
        ? Math.round(timerState.focusDurationMs / MS_PER_SECOND)
        : nextDurationSeconds
    );
  };

  const handleDraftBlur = (event: FocusEvent<HTMLInputElement>) => {
    const nextFocusedElement = event.relatedTarget;
    if (
      nextFocusedElement instanceof HTMLElement &&
      durationEditorRef.current?.contains(nextFocusedElement)
    ) {
      return;
    }

    commitDraftDuration();
  };

  if (!canEditDuration) {
    const [displayMinutes, displaySeconds] = formatTimerLabel(
      timerState.remainingMs
    ).split(":");

    return (
      <>
        {/* Keep the tighter custom tracking here so the timer digits align cleanly at display size. */}
        <div className="flex justify-end">
          <p
            className={`pr-[0.04em] text-right text-[clamp(4rem,12vw,7rem)] leading-none font-black tracking-[-0.04em] tabular-nums ${timerDisplayColorClass}`}
          >
            {displayMinutes}
          </p>
        </div>
        <span className="text-center text-[clamp(4rem,12vw,7rem)] leading-none font-black tracking-[-0.04em] tabular-nums text-foreground/70">
          :
        </span>
        <div className="flex justify-start">
          <p
            className={`pl-[0.04em] text-left text-[clamp(4rem,12vw,7rem)] leading-none font-black tracking-[-0.04em] tabular-nums ${timerDisplayColorClass}`}
          >
            {displaySeconds}
          </p>
        </div>
      </>
    );
  }

  return (
    <div ref={durationEditorRef} className="contents">
      <div className="flex justify-end overflow-visible">
        <input
          aria-label="Focus minutes"
          className="w-[2.6ch] overflow-visible bg-transparent pr-[0.04em] text-right text-[clamp(4rem,12vw,7rem)] leading-none font-black tracking-[-0.04em] tabular-nums text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          inputMode="numeric"
          onBlur={handleDraftBlur}
          onChange={(event) => {
            const nextMinutesInput = sanitizeTimerPart(
              event.currentTarget.value
            );
            onDurationDraftChange((currentDraft) => ({
              ...currentDraft,
              minutesInput: nextMinutesInput,
            }));
          }}
          onFocus={(event) => {
            event.currentTarget.select();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              commitDraftDuration();
              event.currentTarget.blur();
            }
          }}
          value={durationDraft.minutesInput}
        />
      </div>
      <span className="text-center text-[clamp(4rem,12vw,7rem)] leading-none font-black tracking-[-0.04em] tabular-nums text-foreground/70">
        :
      </span>
      <div className="flex justify-start overflow-visible">
        <input
          aria-label="Focus seconds"
          className="w-[2.6ch] overflow-visible bg-transparent pl-[0.04em] text-left text-[clamp(4rem,12vw,7rem)] leading-none font-black tracking-[-0.04em] tabular-nums text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          inputMode="numeric"
          onBlur={handleDraftBlur}
          onChange={(event) => {
            const nextSecondsInput = sanitizeTimerPart(
              event.currentTarget.value
            );
            onDurationDraftChange((currentDraft) => ({
              ...currentDraft,
              secondsInput: nextSecondsInput,
            }));
          }}
          onFocus={(event) => {
            event.currentTarget.select();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              commitDraftDuration();
              event.currentTarget.blur();
            }
          }}
          value={durationDraft.secondsInput}
        />
      </div>
    </div>
  );
}
