/**
 * Focus tab page.
 *
 * This page combines the focus timer controls with the saved session history
 * so users can run cycles and review their recent deep-work activity.
 */
import { memo } from "react";

import type { FocusPageProps } from "@/renderer/features/focus/focus.types";
import {
  createIdleFocusTimerState,
  createRunningFocusTimerState,
  pauseFocusTimerState,
  resumeFocusTimerState,
  setFocusTimerDuration,
} from "@/renderer/features/focus/lib/focus-timer-state";
import { useFocusStore } from "@/renderer/features/focus/state/focus-store";

import { FocusSessionList } from "./components/focus-session-list";
import { FocusTimerCard } from "./components/focus-timer-card";

function FocusPageComponent({
  focusSaveErrorMessage,
  phase,
  sessions,
  sessionsLoadError,
  timerState,
  todayDate,
  onShowWidget,
  onRetryLoad,
}: FocusPageProps) {
  const clearFocusSaveError = useFocusStore(
    (state) => state.clearFocusSaveError
  );
  const setTimerState = useFocusStore((state) => state.setTimerState);

  return (
    <div className="grid gap-6">
      {focusSaveErrorMessage ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {focusSaveErrorMessage}
        </div>
      ) : null}

      <FocusTimerCard
        timerState={timerState}
        onPause={() => setTimerState(pauseFocusTimerState(timerState))}
        onReset={() => {
          clearFocusSaveError();
          setTimerState(
            createIdleFocusTimerState(new Date(), timerState.focusDurationMs)
          );
        }}
        onResume={() => setTimerState(resumeFocusTimerState(timerState))}
        onShowWidget={() => {
          void onShowWidget();
        }}
        onSkipBreak={() => {
          clearFocusSaveError();
          setTimerState(
            createIdleFocusTimerState(new Date(), timerState.focusDurationMs)
          );
        }}
        onStart={(focusDurationMs) => {
          clearFocusSaveError();
          setTimerState(
            createRunningFocusTimerState(new Date(), focusDurationMs)
          );
        }}
        onDurationChange={(focusDurationMs) => {
          setTimerState(setFocusTimerDuration(timerState, focusDurationMs));
        }}
      />

      <FocusSessionList
        phase={phase}
        sessions={sessions}
        sessionsLoadError={sessionsLoadError}
        todayDate={todayDate}
        onRetryLoad={onRetryLoad}
      />
    </div>
  );
}

export const FocusPage = memo(FocusPageComponent);
