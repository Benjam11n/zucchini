import { useFocusStore } from "@/renderer/features/focus/state/focus-store";

export const focusWidgetActions = {
  recordFocusSession: useFocusStore.getState().recordFocusSession,
};
