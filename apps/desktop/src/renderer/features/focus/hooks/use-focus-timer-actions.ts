import { useFocusStore } from "@/renderer/features/focus/state/focus-store";

export function useFocusTimerActions() {
  const clearFocusSaveError = useFocusStore(
    (state) => state.clearFocusSaveError
  );
  const setFocusSaveErrorMessage = useFocusStore(
    (state) => state.setFocusSaveErrorMessage
  );
  const setTimerState = useFocusStore((state) => state.setTimerState);

  return {
    clearFocusSaveError,
    setFocusSaveErrorMessage,
    setTimerState,
  };
}
