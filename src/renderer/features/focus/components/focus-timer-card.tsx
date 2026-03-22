import { Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { FocusDurationEditor } from "@/renderer/features/focus/components/focus-duration-editor";
import { FocusTimerActions } from "@/renderer/features/focus/components/focus-timer-actions";
import { FocusTimerHeader } from "@/renderer/features/focus/components/focus-timer-header";
import {
  getCycleChipLabel,
  getFocusTimerDisplay,
  getFocusTimerPhaseBadge,
  getNextBreakVariant,
  getSkipBreakLabel,
} from "@/renderer/features/focus/components/focus-timer-view-model";
import { PomodoroRoadmapCard } from "@/renderer/features/focus/components/pomodoro-roadmap-card";
import type { PersistedFocusTimerState } from "@/renderer/features/focus/focus.types";
import { formatTimerLabel } from "@/renderer/features/focus/lib/focus-timer-state";
import { clampFocusDurationMs } from "@/renderer/features/focus/lib/focus-timer.constants";
import { MS_PER_SECOND } from "@/renderer/shared/lib/time";
import { Button } from "@/renderer/shared/ui/button";
import { Card, CardContent } from "@/renderer/shared/ui/card";
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
  const {
    isBreak,
    isBreakFinalMinute,
    isIdle,
    isPaused,
    isRunning,
    timerDisplayColorClass,
  } = getFocusTimerDisplay(timerState);
  const phaseBadge = getFocusTimerPhaseBadge(
    timerState,
    isBreak,
    isBreakFinalMinute
  );
  const nextBreakVariant = getNextBreakVariant(
    timerState,
    focusCyclesBeforeLongBreak
  );
  const canEditDuration = isIdle && !isBreak;
  const skipBreakLabel = getSkipBreakLabel(timerState);
  const primaryActionLabel = isPaused ? "Resume" : "Start";
  const cycleChipLabel = getCycleChipLabel(focusCyclesBeforeLongBreak);
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

  return (
    <Card className="overflow-hidden border-border/60 bg-card/95">
      <FocusTimerHeader
        onOpenPomodoroSettings={onOpenPomodoroSettings}
        onShowWidget={onShowWidget}
        phaseBadge={phaseBadge}
      />

      <CardContent className="space-y-5 pt-4">
        <div className="flex justify-center">
          <div className="w-full max-w-[48rem] rounded-[1.75rem] border border-border/60 bg-muted/8 px-4 py-5 sm:px-6 sm:py-6">
            <div className="grid grid-cols-[2.6ch_auto_2.6ch] items-center justify-center gap-1.5 sm:gap-2.5">
              <FocusDurationEditor
                canEditDuration={canEditDuration}
                durationDraft={durationDraft}
                onDurationChange={onDurationChange}
                onDurationDraftChange={setDurationDraft}
                timerDisplayColorClass={timerDisplayColorClass}
                timerState={timerState}
              />
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
                  {formatTimerLabel(focusShortBreakSeconds * MS_PER_SECOND)}{" "}
                  short ·{" "}
                  {formatTimerLabel(focusLongBreakSeconds * MS_PER_SECOND)} long
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

        <FocusTimerActions
          commitDuration={commitDuration}
          durationDraft={durationDraft}
          focusDurationMs={timerState.focusDurationMs}
          isBreak={isBreak}
          isIdle={isIdle}
          isPaused={isPaused}
          isRunning={isRunning}
          onPause={onPause}
          onReset={onReset}
          onResume={onResume}
          onSkipBreak={onSkipBreak}
          onStart={onStart}
          primaryActionLabel={primaryActionLabel}
          skipBreakLabel={skipBreakLabel}
        />
      </CardContent>
    </Card>
  );
}
