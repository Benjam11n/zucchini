import { create } from "zustand";

import type { OnboardingStoreState } from "@/renderer/app/state/types";

function getInitialOnboardingState(): Pick<
  OnboardingStoreState,
  | "isOnboardingOpen"
  | "onboardingError"
  | "onboardingPhase"
  | "onboardingStatus"
> {
  return {
    isOnboardingOpen: false,
    onboardingError: null,
    onboardingPhase: "idle",
    onboardingStatus: null,
  };
}

export const useOnboardingStore = create<OnboardingStoreState>()((set) => ({
  ...getInitialOnboardingState(),
  clearOnboardingError: () =>
    set({
      onboardingError: null,
      onboardingPhase: "idle",
    }),
  setOnboardingError: (onboardingError) => set({ onboardingError }),
  setOnboardingPhase: (onboardingPhase) => set({ onboardingPhase }),
  setOnboardingStatus: (onboardingStatus) => set({ onboardingStatus }),
}));

export function resetOnboardingStore() {
  useOnboardingStore.setState(getInitialOnboardingState());
}
