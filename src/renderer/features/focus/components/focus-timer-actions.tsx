/* eslint-disable react-perf/jsx-no-new-function-as-prop */

import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";

import { MS_PER_SECOND } from "@/renderer/shared/lib/time";
import { Button } from "@/renderer/shared/ui/button";
import { normalizeDurationInputValue } from "@/renderer/shared/ui/duration-input";

interface FocusTimerActionsProps {
  durationDraft: { minutesInput: string; secondsInput: string };
  focusDurationMs: number;
  isBreak: boolean;
  isIdle: boolean;
  isPaused: boolean;
  isRunning: boolean;
  primaryActionLabel: string;
  skipBreakLabel: string;
  commitDuration: (durationSeconds: number) => number;
  onPause: () => void;
  onReset: () => void;
  onResume: () => void;
  onSkipBreak: () => void;
  onStart: (focusDurationMs: number) => void;
}

export function FocusTimerActions({
  durationDraft,
  focusDurationMs,
  isBreak,
  isIdle,
  isPaused,
  isRunning,
  primaryActionLabel,
  skipBreakLabel,
  commitDuration,
  onPause,
  onReset,
  onResume,
  onSkipBreak,
  onStart,
}: FocusTimerActionsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2.5">
      {isIdle || isPaused ? (
        <Button
          className="h-11 min-w-36 rounded-full px-6 text-base"
          onClick={() => {
            if (isPaused) {
              onResume();
              return;
            }

            const nextDurationSeconds = normalizeDurationInputValue(
              durationDraft.minutesInput,
              durationDraft.secondsInput,
              1,
              60 * 60
            );

            onStart(
              commitDuration(
                nextDurationSeconds === null
                  ? Math.round(focusDurationMs / MS_PER_SECOND)
                  : nextDurationSeconds
              )
            );
          }}
        >
          <Play className="size-4" />
          {primaryActionLabel}
        </Button>
      ) : null}

      {isRunning ? (
        <Button
          className="h-11 min-w-36 rounded-full px-6 text-base"
          onClick={onPause}
          variant="secondary"
        >
          <Pause className="size-4" />
          Pause
        </Button>
      ) : null}

      {isIdle ? null : (
        <Button
          className="h-11 min-w-36 rounded-full px-6 text-base"
          onClick={isBreak ? onSkipBreak : onReset}
          variant="outline"
        >
          {isBreak ? (
            <>
              <SkipForward className="size-4" />
              {skipBreakLabel}
            </>
          ) : (
            <>
              <RotateCcw className="size-4" />
              Reset
            </>
          )}
        </Button>
      )}
    </div>
  );
}
