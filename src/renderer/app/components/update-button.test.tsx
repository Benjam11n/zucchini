// @vitest-environment jsdom

import { act, render, screen, waitFor } from "@testing-library/react";
import type * as SonnerModule from "sonner";
import { toast } from "sonner";

import type { AppUpdateState } from "@/shared/contracts/app-updater";

import { UpdateButton } from "./update-button";

const sonnerState = vi.hoisted(() => ({
  dismissToastMock: vi.fn(),
  messageToastMock: vi.fn(),
  toastMock: vi.fn(),
}));

vi.mock<typeof SonnerModule>(import("sonner"), () => ({
  toast: Object.assign(sonnerState.toastMock, {
    dismiss: sonnerState.dismissToastMock,
    message: sonnerState.messageToastMock,
  }) as unknown as typeof toast,
}));

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
    sonnerState.toastMock.mockClear();
    sonnerState.dismissToastMock.mockClear();
    sonnerState.messageToastMock.mockClear();
    const updater = setUpdaterState(IDLE_UPDATE_STATE);

    render(<UpdateButton />);

    await waitFor(() => {
      // eslint-disable-next-line vitest/prefer-called-once, vitest/prefer-called-times
      expect(updater.getState).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(toast.dismiss).toHaveBeenCalledWith("app-update");
  });

  it("shows a toast when an update is available to download", async () => {
    sonnerState.toastMock.mockClear();
    sonnerState.dismissToastMock.mockClear();
    sonnerState.messageToastMock.mockClear();
    const updater = setUpdaterState({
      ...IDLE_UPDATE_STATE,
      availableVersion: "0.1.1-beta.3",
      status: "available",
    });

    render(<UpdateButton />);

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        "Update available",
        expect.objectContaining({
          action: expect.objectContaining({
            label: "Download update",
          }),
          description: "Version 0.1.1-beta.3 is available",
        })
      );
    });

    const action = sonnerState.toastMock.mock.calls.at(-1)?.[1]?.action as {
      onClick: (event: never) => void;
    };

    act(() => {
      action.onClick({} as never);
    });

    await waitFor(() => {
      // eslint-disable-next-line vitest/prefer-called-once, vitest/prefer-called-times
      expect(updater.downloadUpdate).toHaveBeenCalledTimes(1);
    });
  });

  it("shows a restart toast for downloaded updates and can be dismissed", async () => {
    sonnerState.toastMock.mockClear();
    sonnerState.dismissToastMock.mockClear();
    sonnerState.messageToastMock.mockClear();
    const updater = setUpdaterState({
      ...IDLE_UPDATE_STATE,
      availableVersion: "0.1.1-beta.8",
      status: "downloaded",
    });

    render(<UpdateButton />);

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        "Update ready",
        expect.objectContaining({
          action: expect.objectContaining({
            label: "Restart to update",
          }),
          cancel: expect.objectContaining({
            label: "Dismiss",
          }),
        })
      );
    });

    const cancel = sonnerState.toastMock.mock.calls.at(-1)?.[1]?.cancel as {
      onClick: (event: never) => void;
    };

    act(() => {
      cancel.onClick({} as never);
    });

    expect(updater.installUpdate).not.toHaveBeenCalled();
    expect(toast.dismiss).toHaveBeenCalledWith("app-update");
  });

  it("installs downloaded updates when the toast action is clicked", async () => {
    sonnerState.toastMock.mockClear();
    sonnerState.dismissToastMock.mockClear();
    sonnerState.messageToastMock.mockClear();
    const updater = setUpdaterState({
      ...IDLE_UPDATE_STATE,
      availableVersion: "0.1.1-beta.8",
      status: "downloaded",
    });

    render(<UpdateButton />);

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        "Update ready",
        expect.objectContaining({
          action: expect.objectContaining({
            label: "Restart to update",
          }),
          cancel: expect.objectContaining({
            label: "Dismiss",
          }),
          description: "Version 0.1.1-beta.8 is ready",
          id: "app-update",
        })
      );
    });

    const action = sonnerState.toastMock.mock.calls.at(-1)?.[1]?.action as {
      onClick: (event: never) => void;
    };

    act(() => {
      action.onClick({} as never);
    });

    await waitFor(() => {
      // eslint-disable-next-line vitest/prefer-called-once, vitest/prefer-called-times
      expect(updater.installUpdate).toHaveBeenCalledTimes(1);
    });
  });

  it("stays hidden when the updater is unavailable", async () => {
    sonnerState.toastMock.mockClear();
    sonnerState.dismissToastMock.mockClear();
    sonnerState.messageToastMock.mockClear();
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
