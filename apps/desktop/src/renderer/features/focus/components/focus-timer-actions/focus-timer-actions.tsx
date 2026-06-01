import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";

import { Button } from "@/renderer/shared/components/ui/button";
import { normalizeDurationInputValue } from "@/renderer/shared/components/ui/duration-input";
import { MS_PER_SECOND } from "@/renderer/shared/lib/time";

interface FocusTimerActionsProps {
  durationDraft: { minutesInput: string; secondsInput: string };
  focusDurationMs: number;
  primaryActionLabel: string;
  secondaryAction: {
    kind: "reset" | "skip-break";
    label: string;
  } | null;
  status: "idle" | "paused" | "running";
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
  primaryActionLabel,
  secondaryAction,
  status,
  commitDuration,
  onPause,
  onReset,
  onResume,
  onSkipBreak,
  onStart,
}: FocusTimerActionsProps) {
  const isIdle = status === "idle";
  const isPaused = status === "paused";
  const isRunning = status === "running";

  function handlePrimaryAction() {
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
  }

  return (
    <div className="flex flex-wrap justify-center gap-2.5">
      {isIdle || isPaused ? (
        <Button
          className="h-11 min-w-36 px-6 text-base"
          onClick={handlePrimaryAction}
        >
          <Play className="size-4" />
          {primaryActionLabel}
        </Button>
      ) : null}

      {isRunning ? (
        <Button
          className="h-11 min-w-36 px-6 text-base"
          onClick={onPause}
          variant="secondary"
        >
          <Pause className="size-4" />
          Pause
        </Button>
      ) : null}

      {secondaryAction ? (
        <Button
          className="h-11 min-w-36 px-6 text-base"
          onClick={
            secondaryAction.kind === "skip-break" ? onSkipBreak : onReset
          }
          variant="outline"
        >
          {secondaryAction.kind === "skip-break" ? (
            <>
              <SkipForward className="size-4" />
              {secondaryAction.label}
            </>
          ) : (
            <>
              <RotateCcw className="size-4" />
              {secondaryAction.label}
            </>
          )}
        </Button>
      ) : null}
    </div>
  );
}
