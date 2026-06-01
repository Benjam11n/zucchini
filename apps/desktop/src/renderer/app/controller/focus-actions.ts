import { useFocusStore } from "@/renderer/features/focus/state/focus-store";
import type { CreateFocusSessionInput } from "@/shared/domain/focus-session";

export function createFocusActions() {
  return {
    clearFocusSaveError() {
      useFocusStore.getState().clearFocusSaveError();
    },
    async loadFocusSessions(force = false) {
      await useFocusStore.getState().loadFocusSessions(force);
    },
    recordFocusSession(input: CreateFocusSessionInput) {
      return useFocusStore.getState().recordFocusSession(input);
    },
    setFocusSaveErrorMessage(message: string | null) {
      useFocusStore.getState().setFocusSaveErrorMessage(message);
    },
    async showFocusWidget() {
      await window.desktop.showFocusWidget();
    },
  };
}
