import type { PersistedFocusTimerState } from "@/renderer/features/focus/focus.types";
import { formatTimerLabel } from "@/renderer/features/focus/lib/focus-timer-state";
import { clampFocusDurationMs } from "@/renderer/features/focus/lib/focus-timer.constants";
import { DurationInput } from "@/renderer/shared/components/ui/duration-input";
import { MS_PER_SECOND } from "@/renderer/shared/lib/time";

interface FocusDurationEditorProps {
  canEditDuration: boolean;
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
  timerDisplayColorClass,
  timerState,
  onDurationChange,
  onDurationDraftChange,
}: FocusDurationEditorProps) {
  const commitDuration = (durationSeconds: number) => {
    const durationMs = clampFocusDurationMs(durationSeconds * MS_PER_SECOND);

    if (canEditDuration) {
      onDurationChange(durationMs);
    }

    return durationMs;
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
    <DurationInput
      className="contents"
      inputClassName="w-[2.6ch] overflow-visible bg-transparent text-[clamp(4rem,12vw,7rem)] leading-none font-black tracking-[-0.04em] tabular-nums text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      maxSeconds={60 * 60}
      minSeconds={1}
      minuteAriaLabel="Focus minutes"
      minuteInputClassName="pr-[0.04em] text-right"
      minuteWrapperClassName="flex justify-end overflow-visible"
      onCommit={commitDuration}
      onDraftChange={onDurationDraftChange}
      secondAriaLabel="Focus seconds"
      secondInputClassName="pl-[0.04em] text-left"
      secondWrapperClassName="flex justify-start overflow-visible"
      separatorClassName="text-center text-[clamp(4rem,12vw,7rem)] leading-none font-black tracking-[-0.04em] tabular-nums text-foreground/70"
      valueSeconds={Math.round(timerState.focusDurationMs / MS_PER_SECOND)}
    />
  );
}
