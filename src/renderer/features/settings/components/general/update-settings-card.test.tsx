// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

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
  const onStateChange = vi.fn(() => vi.fn());
  const updater = {
    checkForUpdates: vi.fn(async () => {}),
    downloadUpdate: vi.fn(async () => {}),
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

describe("update settings card", () => {
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
});
