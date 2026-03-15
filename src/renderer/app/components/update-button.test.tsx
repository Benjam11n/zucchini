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
  it("stays hidden while the updater is idle", async () => {
    const updater = setUpdaterState(IDLE_UPDATE_STATE);

    render(<UpdateButton />);

    await waitFor(() => {
      // eslint-disable-next-line vitest/prefer-called-once, vitest/prefer-called-times
      expect(updater.getState).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders when an update is available to download", async () => {
    const updater = setUpdaterState({
      ...IDLE_UPDATE_STATE,
      availableVersion: "0.1.1-beta.3",
      status: "available",
    });

    render(<UpdateButton />);

    await expect(
      screen.findByRole("button", { name: /download update/i })
    ).resolves.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /download update/i }));

    await waitFor(() => {
      // eslint-disable-next-line vitest/prefer-called-once, vitest/prefer-called-times
      expect(updater.downloadUpdate).toHaveBeenCalledTimes(1);
    });
  });

  it("uses the default surface for restart-ready updates and can be dismissed", async () => {
    const updater = setUpdaterState({
      ...IDLE_UPDATE_STATE,
      availableVersion: "0.1.1-beta.6",
      status: "downloaded",
    });

    render(<UpdateButton />);

    const restartButton = await screen.findByRole("button", {
      name: /restart to update/i,
    });

    expect(restartButton).toHaveAttribute("data-variant", "outline");

    fireEvent.click(
      screen.getByRole("button", {
        name: /dismiss update notification/i,
      })
    );

    expect(
      screen.queryByRole("button", { name: /restart to update/i })
    ).not.toBeInTheDocument();

    expect(updater.installUpdate).not.toHaveBeenCalled();
  });

  it("installs downloaded updates when the banner is clicked", async () => {
    const updater = setUpdaterState({
      ...IDLE_UPDATE_STATE,
      availableVersion: "0.1.1-beta.6",
      status: "downloaded",
    });

    render(<UpdateButton />);

    fireEvent.click(
      await screen.findByRole("button", { name: /restart to update/i })
    );

    await waitFor(() => {
      // eslint-disable-next-line vitest/prefer-called-once, vitest/prefer-called-times
      expect(updater.installUpdate).toHaveBeenCalledTimes(1);
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
