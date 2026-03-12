import { create } from "zustand";

import type { HabitsIpcError } from "@/shared/contracts/habits-ipc";
import type { OnboardingStatus } from "@/shared/domain/onboarding";

export interface OnboardingStoreState {
  isOnboardingOpen: boolean;
  onboardingError: HabitsIpcError | null;
  onboardingPhase: "idle" | "submitting";
  onboardingStatus: OnboardingStatus | null;
  clearOnboardingError: () => void;
  setOnboardingError: (error: HabitsIpcError | null) => void;
  setOnboardingPhase: (phase: OnboardingStoreState["onboardingPhase"]) => void;
  setOnboardingStatus: (status: OnboardingStatus | null) => void;
}

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
