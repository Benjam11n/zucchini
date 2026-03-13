import {
  Minus,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  SkipForward,
  Plus,
} from "lucide-react";
import { useEffect, useState } from "react";

import { PomodoroRoadmapCard } from "@/renderer/features/focus/components/pomodoro-roadmap-card";
import type { PersistedFocusTimerState } from "@/renderer/features/focus/focus.types";
import { formatTimerLabel } from "@/renderer/features/focus/lib/focus-timer-state";
import {
  clampFocusDurationMs,
  splitFocusDurationMs,
} from "@/renderer/features/focus/lib/focus-timer.constants";
import {
  MS_PER_MINUTE,
  MS_PER_SECOND,
  SECONDS_PER_MINUTE,
} from "@/renderer/shared/lib/time";
import { Badge } from "@/renderer/shared/ui/badge";
import { Button } from "@/renderer/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/ui/card";
import type { PomodoroTimerSettings } from "@/shared/domain/settings";

interface FocusTimerCardProps {
  focusLongBreakMinutes: number;
  focusCyclesBeforeLongBreak: number;
  focusShortBreakMinutes: number;
  onCycleChange: (focusCyclesBeforeLongBreak: number) => void;
  pomodoroSettings: PomodoroTimerSettings;
  timerState: PersistedFocusTimerState;
  onDurationChange: (focusDurationMs: number) => void;
  onOpenPomodoroSettings: () => void;
  onPause: () => void;
  onReset: () => void;
  onResume: () => void;
  onShowWidget: () => void;
  onSkipBreak: () => void;
  onStart: (focusDurationMs: number) => void;
}

function getPhaseBadge(
  timerState: PersistedFocusTimerState,
  isBreak: boolean,
  isBreakFinalMinute: boolean
): {
  label: string;
  variant: "default" | "destructive" | "secondary";
} {
  if (isBreakFinalMinute) {
    return {
      label: "1 min left",
      variant: "destructive",
    };
  }

  if (timerState.breakVariant === "long") {
    return {
      label: "Long break",
      variant: "secondary",
    };
  }

  if (isBreak) {
    return {
      label: "Short break",
      variant: "secondary",
    };
  }

  return {
    label: "Focus",
    variant: "default",
  };
}

function getNextBreakVariant(
  timerState: PersistedFocusTimerState,
  focusCyclesBeforeLongBreak: number
): "long" | "short" {
  if (timerState.phase === "break" && timerState.breakVariant === "long") {
    return "long";
  }

  return timerState.completedFocusCycles + 1 >= focusCyclesBeforeLongBreak
    ? "long"
    : "short";
}

function getCycleChipLabel(focusCyclesBeforeLongBreak: number): string {
  return focusCyclesBeforeLongBreak === 1
    ? "Long break after 1 session"
    : `Long break after ${focusCyclesBeforeLongBreak} sessions`;
}

function padTimerPart(value: number): string {
  return value.toString().padStart(2, "0");
}

function sanitizeTimerInput(value: string): string {
  return value.replaceAll(/\D/g, "").slice(0, 2);
}

export function FocusTimerCard({
  focusLongBreakMinutes,
  focusCyclesBeforeLongBreak,
  focusShortBreakMinutes,
  onCycleChange,
  pomodoroSettings,
  timerState,
  onDurationChange,
  onOpenPomodoroSettings,
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
  const isLastMinute = isRunning && timerState.remainingMs <= MS_PER_MINUTE;
  const isBreakFinalMinute =
    isBreak && isRunning && timerState.remainingMs <= MS_PER_MINUTE;
  const phaseBadge = getPhaseBadge(timerState, isBreak, isBreakFinalMinute);
  const timerDisplayColorClass = isLastMinute
    ? "text-amber-300"
    : "text-foreground";
  const nextBreakVariant = getNextBreakVariant(
    timerState,
    focusCyclesBeforeLongBreak
  );

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
  const cycleChipLabel = getCycleChipLabel(focusCyclesBeforeLongBreak);

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
      (normalizedMinutes * SECONDS_PER_MINUTE +
        (normalizedMinutes === 60 ? 0 : normalizedSeconds)) *
        MS_PER_SECOND
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
      <CardHeader className="gap-4 pb-0">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <CardDescription>Pomodoro</CardDescription>
            <CardTitle>Focused work timer</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="rounded-full"
              onClick={onOpenPomodoroSettings}
              size="sm"
              variant="ghost"
            >
              <Settings2 className="size-4" />
              Settings
            </Button>
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
              variant={phaseBadge.variant}
            >
              {phaseBadge.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-4">
        <div className="flex justify-center">
          <div className="w-full max-w-[48rem] rounded-[1.75rem] border border-border/60 bg-muted/8 px-4 py-5 sm:px-6 sm:py-6">
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

            <div className="mt-4">
              <PomodoroRoadmapCard
                settings={pomodoroSettings}
                timerState={timerState}
              />
            </div>

            <div className="mt-3 grid gap-2.5 md:grid-cols-[1fr_1fr]">
              <div className="rounded-2xl border border-border/60 bg-background/60 px-3 py-2.5">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  Quick breaks
                </p>
                <p className="mt-1.5 text-sm font-medium">
                  {focusShortBreakMinutes}m short · {focusLongBreakMinutes}m
                  long
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Next break: {nextBreakVariant}
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-background/60 px-3 py-2.5">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  Long break after
                </p>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <Button
                    aria-label="Decrease cycles before long break"
                    className="rounded-full"
                    onClick={() => {
                      onCycleChange(
                        Math.max(1, focusCyclesBeforeLongBreak - 1)
                      );
                    }}
                    size="icon-sm"
                    variant="outline"
                  >
                    <Minus className="size-4" />
                  </Button>
                  <p className="text-center text-sm font-medium">
                    {cycleChipLabel}
                  </p>
                  <Button
                    aria-label="Increase cycles before long break"
                    className="rounded-full"
                    onClick={() => {
                      onCycleChange(
                        Math.min(12, focusCyclesBeforeLongBreak + 1)
                      );
                    }}
                    size="icon-sm"
                    variant="outline"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2.5">
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
