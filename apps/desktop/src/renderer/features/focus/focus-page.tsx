/**
 * Focus tab page.
 *
 * This page combines the focus timer controls with the saved session history
 * so users can run cycles and review their recent deep-work activity.
 */
import { memo, useState } from "react";

import type { FocusPageProps } from "@/renderer/features/focus/focus.types";
import { resetFocusTimerSession } from "@/renderer/features/focus/lib/focus-timer-session";
import {
  createRunningFocusTimerState,
  getPomodoroFocusDurationMs,
  pauseFocusTimerState,
  resumeFocusTimerState,
  setFocusTimerDuration,
  skipBreakFocusTimerState,
} from "@/renderer/features/focus/lib/focus-timer-state";
import { useFocusStore } from "@/renderer/features/focus/state/focus-store";
import { PomodoroSettingsFields } from "@/renderer/features/settings/components/general/pomodoro-settings-fields";
import { Card, CardContent } from "@/renderer/shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/renderer/shared/ui/dialog";

import { FocusSessionList } from "./components/focus-session-list";
import { FocusTimerCard } from "./components/focus-timer-card";

function FocusPageComponent({
  fieldErrors,
  focusSaveErrorMessage,
  phase,
  sessions,
  sessionsLoadError,
  settings,
  settingsSavePhase,
  timerState,
  todayDate,
  onChangeSettings,
  onShowWidget,
  onRetryLoad,
}: FocusPageProps) {
  const clearFocusSaveError = useFocusStore(
    (state) => state.clearFocusSaveError
  );
  const setFocusSaveErrorMessage = useFocusStore(
    (state) => state.setFocusSaveErrorMessage
  );
  const setTimerState = useFocusStore((state) => state.setTimerState);
  const [isPomodoroDialogOpen, setIsPomodoroDialogOpen] = useState(false);
  const defaultFocusDurationMs = getPomodoroFocusDurationMs(settings);

  const handleSettingsChange = (nextSettings: FocusPageProps["settings"]) => {
    onChangeSettings(nextSettings);

    if (timerState.status === "idle" && timerState.phase === "focus") {
      setTimerState(
        setFocusTimerDuration(
          timerState,
          getPomodoroFocusDurationMs(nextSettings)
        )
      );
    }
  };

  const handleReset = async () => {
    await resetFocusTimerSession({
      clearFocusSaveError,
      focusDurationMs: defaultFocusDurationMs,
      recordFocusSession: window.habits.recordFocusSession,
      setFocusSaveErrorMessage,
      setTimerState,
      timerState,
    });
  };

  return (
    <div className="grid gap-6">
      {focusSaveErrorMessage ? (
        <div className="rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {focusSaveErrorMessage}
        </div>
      ) : null}

      <div className="grid gap-6">
        <FocusTimerCard
          focusCyclesBeforeLongBreak={settings.focusCyclesBeforeLongBreak}
          focusLongBreakSeconds={settings.focusLongBreakSeconds}
          focusShortBreakSeconds={settings.focusShortBreakSeconds}
          onCycleChange={(focusCyclesBeforeLongBreak) => {
            handleSettingsChange({
              ...settings,
              focusCyclesBeforeLongBreak,
            });
          }}
          pomodoroSettings={settings}
          timerState={timerState}
          onDurationChange={(focusDurationMs) => {
            handleSettingsChange({
              ...settings,
              focusDefaultDurationSeconds: Math.round(focusDurationMs / 1000),
            });
          }}
          onOpenPomodoroSettings={() => {
            setIsPomodoroDialogOpen(true);
          }}
          onPause={() => setTimerState(pauseFocusTimerState(timerState))}
          onReset={handleReset}
          onResume={() => setTimerState(resumeFocusTimerState(timerState))}
          onShowWidget={onShowWidget}
          onSkipBreak={() => {
            clearFocusSaveError();
            setTimerState(
              skipBreakFocusTimerState(
                timerState,
                defaultFocusDurationMs,
                new Date()
              )
            );
          }}
          onStart={(focusDurationMs) => {
            clearFocusSaveError();
            setTimerState(
              createRunningFocusTimerState(
                new Date(),
                focusDurationMs,
                timerState.completedFocusCycles
              )
            );
          }}
        />
      </div>

      <FocusSessionList
        phase={phase}
        sessions={sessions}
        sessionsLoadError={sessionsLoadError}
        timerState={timerState}
        todayDate={todayDate}
        onRetryLoad={onRetryLoad}
      />

      <Dialog
        open={isPomodoroDialogOpen}
        onOpenChange={setIsPomodoroDialogOpen}
      >
        <DialogContent className="max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pomodoro settings</DialogTitle>
            <DialogDescription>
              Fine-tune your default focus duration, break lengths, and cycle
              cadence. Changes save automatically.
            </DialogDescription>
          </DialogHeader>

          <Card className="border-0 bg-transparent shadow-none ring-0">
            <CardContent className="space-y-4 px-6 pb-6">
              {settingsSavePhase === "invalid" ? (
                <p className="text-sm text-destructive">
                  Fix the highlighted pomodoro settings before they can save.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Idle changes update the next start immediately. Active timers
                  keep running and pick up new defaults on the next phase.
                </p>
              )}
              <PomodoroSettingsFields
                fieldErrors={fieldErrors}
                idPrefix="focus-page-pomodoro-dialog"
                onChange={handleSettingsChange}
                settings={settings}
              />
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const FocusPage = memo(FocusPageComponent);
