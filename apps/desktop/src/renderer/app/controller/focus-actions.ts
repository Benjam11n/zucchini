/**
 * Focus page action creators.
 *
 * Wraps the focus Zustand store to expose session recording, save error
 * management, and widget visibility actions used by the controller.
 */
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
    async recordFocusSession(input: CreateFocusSessionInput) {
      const focusSession = await window.habits.recordFocusSession(input);
      useFocusStore.getState().setFocusSaveErrorMessage(null);
      return focusSession;
    },
    setFocusSaveErrorMessage(message: string | null) {
      useFocusStore.getState().setFocusSaveErrorMessage(message);
    },
    async showFocusWidget() {
      await window.habits.showFocusWidget();
    },
  };
}
