// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { AppUpdateState } from "@/shared/contracts/app-updater";

import { UpdateButton } from "./update-button";

const IDLE_UPDATE_STATE: AppUpdateState = {
  availableVersion: null,
  currentVersion: "0.1.1-beta.1",
  errorMessage: null,
  progressPercent: null,
  status: "idle",
};

function setUpdaterState(state: AppUpdateState) {
  const onStateChange = vi.fn(() => vi.fn());

  Object.defineProperty(window, "updater", {
    configurable: true,
    value: {
      checkForUpdates: vi.fn(async () => {}),
      downloadUpdate: vi.fn(async () => {}),
      getState: vi.fn().mockResolvedValue(state),
      installUpdate: vi.fn(async () => {}),
      onStateChange,
    },
  });

  return window.updater;
}

describe("update button", () => {
  it("renders a manual check action while updates are idle", async () => {
    const updater = setUpdaterState(IDLE_UPDATE_STATE);

    render(<UpdateButton />);

    await expect(
      screen.findByRole("button", { name: /check for updates/i })
    ).resolves.toBeInTheDocument();
    expect(
      screen.getByText("Current version 0.1.1-beta.1")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /check for updates/i }));

    await waitFor(() => {
      // eslint-disable-next-line vitest/prefer-called-once, vitest/prefer-called-times
      expect(updater.checkForUpdates).toHaveBeenCalledTimes(1);
    });
  });

  it("stays hidden when the updater is unavailable", async () => {
    const updater = setUpdaterState({
      ...IDLE_UPDATE_STATE,
      status: "unavailable",
    });

    render(<UpdateButton />);

    await waitFor(() => {
      // eslint-disable-next-line vitest/prefer-called-once, vitest/prefer-called-times
      expect(updater.getState).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
