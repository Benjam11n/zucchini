import { memo } from "react";

import { useFocusStore } from "@/renderer/features/app/stores/focus-store";

import { FocusSessionList } from "./focus-session-list";
import { FocusTimerCard } from "./focus-timer-card";
import type { FocusTabProps } from "./types";
import {
  createIdleFocusTimerState,
  createRunningFocusTimerState,
  pauseFocusTimerState,
  resumeFocusTimerState,
} from "./use-focus-timer";

function FocusTabComponent({
  focusSaveErrorMessage,
  phase,
  sessions,
  sessionsLoadError,
  timerState,
  todayDate,
  onShowWidget,
  onRetryLoad,
}: FocusTabProps) {
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
          setTimerState(createIdleFocusTimerState());
        }}
        onResume={() => setTimerState(resumeFocusTimerState(timerState))}
        onShowWidget={() => {
          void onShowWidget();
        }}
        onSkipBreak={() => {
          clearFocusSaveError();
          setTimerState(createIdleFocusTimerState());
        }}
        onStart={() => {
          clearFocusSaveError();
          setTimerState(createRunningFocusTimerState());
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

export const FocusTab = memo(FocusTabComponent);
