// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { STORAGE_KEYS } from "@/renderer/shared/lib/storage";
import type { AppUpdateState } from "@/shared/contracts/app-updater";

import { UpdateSettingsCard } from "./update-settings-card";

const IDLE_UPDATE_STATE: AppUpdateState = {
  availableVersion: null,
  currentVersion: "0.1.1-beta.9",
  errorMessage: null,
  progressPercent: null,
  status: "idle",
};

function setUpdaterState(state: AppUpdateState) {
  let stateChangeListener: ((state: AppUpdateState) => void) | null = null;
  const onStateChange = vi.fn((listener: (state: AppUpdateState) => void) => {
    stateChangeListener = listener;
    return vi.fn();
  });
  const updater = {
    checkForUpdates: vi.fn(async () => {}),
    downloadUpdate: vi.fn(async () => {}),
    emitStateChange(nextState: AppUpdateState) {
      stateChangeListener?.(nextState);
    },
    getState: vi.fn().mockResolvedValue(state),
    installUpdate: vi.fn(async () => {}),
    onStateChange,
  };

  Object.defineProperty(window, "updater", {
    configurable: true,
    value: updater,
  });

  return updater;
}

const storage = new Map<string, string>();

const localStorageMock = {
  getItem(key: string): string | null {
    return storage.get(key) ?? null;
  },
  removeItem(key: string): void {
    storage.delete(key);
  },
  setItem(key: string, value: string): void {
    storage.set(key, value);
  },
};

describe("update settings card", () => {
  beforeEach(() => {
    storage.clear();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: localStorageMock,
    });
  });

  it("shows the manual check action in settings while idle", async () => {
    const updater = setUpdaterState(IDLE_UPDATE_STATE);

    render(<UpdateSettingsCard />);

    await expect(
      screen.findByRole("button", { name: /check for updates/i })
    ).resolves.toBeInTheDocument();
    expect(
      screen.getByText("Current version 0.1.1-beta.9.")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /check for updates/i }));

    await waitFor(() => {
      expect(updater.checkForUpdates.mock.calls).toHaveLength(1);
    });
  });

  it("shows the available version after a manual check finds an update", async () => {
    const updater = setUpdaterState(IDLE_UPDATE_STATE);

    render(<UpdateSettingsCard />);

    await expect(
      screen.findByRole("button", { name: /check for updates/i })
    ).resolves.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /check for updates/i }));

    await waitFor(() => {
      expect(updater.checkForUpdates.mock.calls).toHaveLength(1);
    });

    updater.emitStateChange({
      ...IDLE_UPDATE_STATE,
      availableVersion: "0.1.1-beta.10",
      status: "available",
    });

    await expect(
      screen.findByText("Version 0.1.1-beta.10 is available.")
    ).resolves.toBeInTheDocument();
  });

  it("stays hidden when updater support is unavailable", async () => {
    const updater = setUpdaterState({
      ...IDLE_UPDATE_STATE,
      status: "unavailable",
    });

    render(<UpdateSettingsCard />);

    await waitFor(() => {
      expect(updater.getState.mock.calls).toHaveLength(1);
    });

    expect(screen.queryByText("App updates")).not.toBeInTheDocument();
  });

  it("clears a dismissed release when the user manually checks for updates", async () => {
    storage.set(
      STORAGE_KEYS.updateToastDismissal,
      JSON.stringify({
        dismissedVersion: "0.1.1-beta.10",
      })
    );
    const updater = setUpdaterState(IDLE_UPDATE_STATE);

    render(<UpdateSettingsCard />);

    await expect(
      screen.findByRole("button", { name: /check for updates/i })
    ).resolves.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /check for updates/i }));

    await waitFor(() => {
      expect(updater.checkForUpdates.mock.calls).toHaveLength(1);
    });

    expect(localStorage.getItem(STORAGE_KEYS.updateToastDismissal)).toBeNull();
  });
});
