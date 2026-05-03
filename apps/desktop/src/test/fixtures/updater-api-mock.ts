import type { AppUpdateState } from "@/shared/contracts/app-updater";

const createNoopAsync = () => vi.fn(() => Promise.resolve());

export const IDLE_UPDATE_STATE: AppUpdateState = {
  availableVersion: null,
  currentVersion: "0.1.1-beta.1",
  errorMessage: null,
  progressPercent: null,
  status: "idle",
};

export function createIdleUpdateState(
  overrides: Partial<AppUpdateState> = {}
): AppUpdateState {
  return {
    ...IDLE_UPDATE_STATE,
    ...overrides,
  };
}

export function setUpdaterState(state: AppUpdateState) {
  let stateChangeListener: ((state: AppUpdateState) => void) | null = null;
  const onStateChange = vi.fn((listener: (state: AppUpdateState) => void) => {
    stateChangeListener = listener;
    return vi.fn();
  });
  const updater = {
    checkForUpdates: createNoopAsync(),
    downloadUpdate: createNoopAsync(),
    emitStateChange(nextState: AppUpdateState) {
      stateChangeListener?.(nextState);
    },
    getState: vi.fn().mockResolvedValue(state),
    installUpdate: createNoopAsync(),
    onStateChange,
  };

  Object.defineProperty(window, "updater", {
    configurable: true,
    value: updater,
  });

  return updater;
}
