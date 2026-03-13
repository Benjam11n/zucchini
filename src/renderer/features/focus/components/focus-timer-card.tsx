import {
  Minus,
  Plus,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  SkipForward,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FocusEvent } from "react";

import { PomodoroRoadmapCard } from "@/renderer/features/focus/components/pomodoro-roadmap-card";
import type { PersistedFocusTimerState } from "@/renderer/features/focus/focus.types";
import { formatTimerLabel } from "@/renderer/features/focus/lib/focus-timer-state";
import { clampFocusDurationMs } from "@/renderer/features/focus/lib/focus-timer.constants";
import { MS_PER_MINUTE, MS_PER_SECOND } from "@/renderer/shared/lib/time";
import { Badge } from "@/renderer/shared/ui/badge";
import { Button } from "@/renderer/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/ui/card";
import {
  formatDurationInputValue,
  normalizeDurationInputValue,
} from "@/renderer/shared/ui/duration-input";
import type { PomodoroTimerSettings } from "@/shared/domain/settings";

interface FocusTimerCardProps {
  focusLongBreakSeconds: number;
  focusCyclesBeforeLongBreak: number;
  focusShortBreakSeconds: number;
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
    : `${focusCyclesBeforeLongBreak} sessions`;
}

function sanitizeTimerPart(value: string): string {
  return value.replaceAll(/\D/g, "").slice(0, 2);
}

export function FocusTimerCard({
  focusLongBreakSeconds,
  focusCyclesBeforeLongBreak,
  focusShortBreakSeconds,
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
  const [displayMinutes, displaySeconds] = formatTimerLabel(
    timerState.remainingMs
  ).split(":");
  const primaryActionLabel = isPaused ? "Resume" : "Start";
  const cycleChipLabel = getCycleChipLabel(focusCyclesBeforeLongBreak);
  const durationEditorRef = useRef<HTMLDivElement | null>(null);
  const [durationDraft, setDurationDraft] = useState(() => {
    const [minutesInput, secondsInput] = formatTimerLabel(
      timerState.focusDurationMs
    ).split(":");

    return {
      minutesInput,
      secondsInput,
    };
  });

  useEffect(() => {
    if (!canEditDuration) {
      return;
    }

    const [minutesInput, secondsInput] = formatTimerLabel(
      timerState.focusDurationMs
    ).split(":");
    setDurationDraft({
      minutesInput,
      secondsInput,
    });
  }, [canEditDuration, timerState.focusDurationMs]);

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
                        setDurationDraft((currentDraft) => ({
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
                        setDurationDraft((currentDraft) => ({
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
                  {formatDurationInputValue(focusShortBreakSeconds)} short ·{" "}
                  {formatDurationInputValue(focusLongBreakSeconds)} long
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

                const nextDurationSeconds = normalizeDurationInputValue(
                  durationDraft.minutesInput,
                  durationDraft.secondsInput,
                  1,
                  60 * 60
                );

                onStart(
                  commitDuration(
                    nextDurationSeconds === null
                      ? Math.round(timerState.focusDurationMs / MS_PER_SECOND)
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
