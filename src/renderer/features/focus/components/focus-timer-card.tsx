import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useEffect, useState } from "react";

import type { PersistedFocusTimerState } from "@/renderer/features/focus/focus.types";
import { formatTimerLabel } from "@/renderer/features/focus/lib/focus-timer-state";
import {
  clampFocusDurationMs,
  splitFocusDurationMs,
} from "@/renderer/features/focus/lib/focus-timer.constants";
import { Badge } from "@/renderer/shared/ui/badge";
import { Button } from "@/renderer/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/ui/card";

interface FocusTimerCardProps {
  focusCyclesBeforeLongBreak: number;
  timerState: PersistedFocusTimerState;
  onDurationChange: (focusDurationMs: number) => void;
  onPause: () => void;
  onReset: () => void;
  onResume: () => void;
  onShowWidget: () => void;
  onSkipBreak: () => void;
  onStart: (focusDurationMs: number) => void;
}

function padTimerPart(value: number): string {
  return value.toString().padStart(2, "0");
}

function sanitizeTimerInput(value: string): string {
  return value.replaceAll(/\D/g, "").slice(0, 2);
}

export function FocusTimerCard({
  focusCyclesBeforeLongBreak,
  timerState,
  onDurationChange,
  onPause,
  onReset,
  onResume,
  onShowWidget,
  onSkipBreak,
  onStart,
}: FocusTimerCardProps) {
  const isBreak = timerState.phase === "break";
  const isIdle = timerState.status === "idle";
  const isPaused = timerState.status === "paused";
  const isRunning = timerState.status === "running";
  const isLastMinute = isRunning && timerState.remainingMs <= 60 * 1000;
  const isBreakFinalMinute =
    isBreak && isRunning && timerState.remainingMs <= 60 * 1000;
  let phaseBadgeVariant: "default" | "destructive" | "secondary" = "default";
  let phaseBadgeLabel = "Focus";
  const timerDisplayColorClass = isLastMinute
    ? "text-amber-300"
    : "text-foreground";

  if (isBreakFinalMinute) {
    phaseBadgeVariant = "destructive";
    phaseBadgeLabel = "1 min left";
  } else if (timerState.breakVariant === "long") {
    phaseBadgeVariant = "secondary";
    phaseBadgeLabel = "Long break";
  } else if (isBreak) {
    phaseBadgeVariant = "secondary";
    phaseBadgeLabel = "Short break";
  }

  let nextBreakVariant = "short";
  if (timerState.phase !== "break" || timerState.breakVariant !== "long") {
    nextBreakVariant =
      timerState.completedFocusCycles + 1 >= focusCyclesBeforeLongBreak
        ? "long"
        : "short";
  }

  const canEditDuration = isIdle && !isBreak;
  const durationParts = splitFocusDurationMs(timerState.focusDurationMs);
  const [displayMinutes, displaySeconds] = formatTimerLabel(
    timerState.remainingMs
  ).split(":");
  const [minutesInput, setMinutesInput] = useState(() =>
    padTimerPart(durationParts.minutes)
  );
  const [secondsInput, setSecondsInput] = useState(() =>
    padTimerPart(durationParts.seconds)
  );
  const primaryActionLabel = isPaused ? "Resume" : "Start";

  useEffect(() => {
    setMinutesInput(padTimerPart(durationParts.minutes));
    setSecondsInput(padTimerPart(durationParts.seconds));
  }, [durationParts.minutes, durationParts.seconds]);

  const commitDuration = (
    nextMinutesInput = minutesInput,
    nextSecondsInput = secondsInput
  ) => {
    const parsedMinutes = Number.parseInt(nextMinutesInput, 10);
    const parsedSeconds = Number.parseInt(nextSecondsInput, 10);
    const normalizedMinutes = Number.isNaN(parsedMinutes)
      ? durationParts.minutes
      : Math.min(60, Math.max(0, parsedMinutes));
    const normalizedSeconds = Number.isNaN(parsedSeconds)
      ? durationParts.seconds
      : Math.min(59, Math.max(0, parsedSeconds));
    const durationMs = clampFocusDurationMs(
      (normalizedMinutes * 60 +
        (normalizedMinutes === 60 ? 0 : normalizedSeconds)) *
        1000
    );
    const normalizedParts = splitFocusDurationMs(durationMs);

    setMinutesInput(padTimerPart(normalizedParts.minutes));
    setSecondsInput(padTimerPart(normalizedParts.seconds));

    if (canEditDuration) {
      onDurationChange(durationMs);
    }

    return durationMs;
  };

  return (
    <Card className="overflow-hidden border-border/60 bg-card/95">
      <CardHeader className="gap-6 pb-0">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <CardDescription>Pomodoro</CardDescription>
            <CardTitle>Focused work timer</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="rounded-full border-white/10 bg-white/3 px-4"
              onClick={onShowWidget}
              size="sm"
              variant="outline"
            >
              Show widget
            </Button>
            <Badge
              className="rounded-full px-3 py-1"
              variant={phaseBadgeVariant}
            >
              {phaseBadgeLabel}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8 pt-6">
        <div className="flex justify-center">
          <div className="w-full max-w-[48rem] rounded-[2rem] border border-border/60 bg-muted/15 px-5 py-8 sm:px-8 sm:py-10">
            <div className="grid grid-cols-[2.6ch_auto_2.6ch] items-center justify-center gap-1.5 sm:gap-2.5">
              {canEditDuration ? (
                <>
                  <div className="flex justify-end overflow-visible">
                    <input
                      aria-label="Focus minutes"
                      className="w-[2.6ch] overflow-visible bg-transparent pr-[0.04em] text-right text-[clamp(4rem,12vw,7rem)] leading-none font-black tracking-[-0.04em] tabular-nums text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      inputMode="numeric"
                      onBlur={() => {
                        commitDuration();
                      }}
                      onChange={(event) => {
                        setMinutesInput(
                          sanitizeTimerInput(event.currentTarget.value)
                        );
                      }}
                      onFocus={(event) => {
                        event.currentTarget.select();
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          commitDuration();
                          event.currentTarget.blur();
                        }
                      }}
                      value={minutesInput}
                    />
                  </div>
                  <span className="text-center text-[clamp(4rem,12vw,7rem)] leading-none font-black tracking-[-0.04em] tabular-nums text-foreground/70">
                    :
                  </span>
                  <div className="flex justify-start overflow-visible">
                    <input
                      aria-label="Focus seconds"
                      className="w-[2.6ch] overflow-visible pl-[0.04em] text-left text-[clamp(4rem,12vw,7rem)] leading-none font-black tracking-[-0.04em] tabular-nums text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      inputMode="numeric"
                      onBlur={() => {
                        commitDuration();
                      }}
                      onChange={(event) => {
                        setSecondsInput(
                          sanitizeTimerInput(event.currentTarget.value)
                        );
                      }}
                      onFocus={(event) => {
                        event.currentTarget.select();
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          commitDuration();
                          event.currentTarget.blur();
                        }
                      }}
                      value={secondsInput}
                    />
                  </div>
                </>
              ) : (
                <>
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
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span>
                Completed this set: {timerState.completedFocusCycles}/
                {focusCyclesBeforeLongBreak}
              </span>
              <span>Next break: {nextBreakVariant}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {isIdle || isPaused ? (
            <Button
              className="h-11 min-w-36 rounded-full px-6 text-base"
              onClick={() => {
                if (isPaused) {
                  onResume();
                  return;
                }

                onStart(commitDuration());
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
                  Skip break
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
      </CardContent>
    </Card>
  );
}
