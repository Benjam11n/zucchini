import { useFocusStore } from "@/renderer/features/focus/state/focus-store";
import { appClient } from "@/renderer/shared/lib/app-client";
import type { CreateFocusSessionInput } from "@/shared/domain/focus-session";

export function createFocusActions() {
  return {
    clearFocusSaveError() {
      useFocusStore.getState().clearFocusSaveError();
    },
    async loadFocusSessions(force = false) {
      await useFocusStore.getState().loadFocusSessions(force);
    },
    async recordFocusSession(input: CreateFocusSessionInput) {
      const focusSession = await appClient.recordFocusSession(input);
      useFocusStore.getState().setFocusSaveErrorMessage(null);
      return focusSession;
    },
    setFocusSaveErrorMessage(message: string | null) {
      useFocusStore.getState().setFocusSaveErrorMessage(message);
    },
    async showFocusWidget() {
      await window.desktop.showFocusWidget();
    },
  };
}
