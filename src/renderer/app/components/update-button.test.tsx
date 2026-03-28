// @vitest-environment jsdom

import { act, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import type { ExternalToast } from "sonner";

import type { AppUpdateState } from "@/shared/contracts/app-updater";

import { UpdateButton } from "./update-button";

const sonnerState = vi.hoisted(() => ({
  dismissToastMock: vi.fn(),
  messageToastMock: vi.fn(),
  toastMock: vi.fn(),
}));

interface ToastAction {
  onClick: (event: never) => void;
}

type ToastFn = (message: string, data?: ExternalToast) => string | number;

vi.mock(import("sonner"), async (importOriginal) => {
  const actual = await importOriginal();
  const toastProxy = ((message: string, data?: ExternalToast) =>
    sonnerState.toastMock(message, data)) as ToastFn;

  return {
    ...actual,
    toast: Object.assign(toastProxy, actual.toast, {
      dismiss: sonnerState.dismissToastMock,
      message: sonnerState.messageToastMock,
    }),
  };
});

const IDLE_UPDATE_STATE: AppUpdateState = {
  availableVersion: null,
  currentVersion: "0.1.1-beta.1",
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

describe("update button", () => {
  it("stays hidden while the updater is idle", async () => {
    sonnerState.toastMock.mockClear();
    sonnerState.dismissToastMock.mockClear();
    sonnerState.messageToastMock.mockClear();
    const updater = setUpdaterState(IDLE_UPDATE_STATE);

    render(<UpdateButton />);

    await waitFor(() => {
      expect(updater.getState.mock.calls).toHaveLength(1);
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
      expect(sonnerState.toastMock).toHaveBeenCalledWith(
        "Update available",
        expect.objectContaining({
          action: expect.objectContaining({
            label: "Download update",
          }),
          description: "Version 0.1.1-beta.3 is available",
        })
      );
    });

    const action = sonnerState.toastMock.mock.calls.at(-1)?.[1]
      ?.action as ToastAction;

    act(() => {
      action.onClick({} as never);
    });

    await waitFor(() => {
      expect(updater.downloadUpdate.mock.calls).toHaveLength(1);
    });
  });

  it("shows a toast when updater emits an available update after loading idle", async () => {
    sonnerState.toastMock.mockClear();
    sonnerState.dismissToastMock.mockClear();
    sonnerState.messageToastMock.mockClear();
    const updater = setUpdaterState(IDLE_UPDATE_STATE);

    render(<UpdateButton />);

    await waitFor(() => {
      expect(updater.getState.mock.calls).toHaveLength(1);
    });

    act(() => {
      updater.emitStateChange({
        ...IDLE_UPDATE_STATE,
        availableVersion: "0.1.1-beta.10",
        status: "available",
      });
    });

    await waitFor(() => {
      expect(sonnerState.toastMock).toHaveBeenCalledWith(
        "Update available",
        expect.objectContaining({
          description: "Version 0.1.1-beta.10 is available",
        })
      );
    });
  });

  it("shows a restart toast for downloaded updates and can be dismissed", async () => {
    sonnerState.toastMock.mockClear();
    sonnerState.dismissToastMock.mockClear();
    sonnerState.messageToastMock.mockClear();
    const updater = setUpdaterState({
      ...IDLE_UPDATE_STATE,
      availableVersion: "0.1.1-beta.9",
      status: "downloaded",
    });

    render(<UpdateButton />);

    await waitFor(() => {
      expect(sonnerState.toastMock).toHaveBeenCalledWith(
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

    const cancel = sonnerState.toastMock.mock.calls.at(-1)?.[1]
      ?.cancel as ToastAction;

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
      availableVersion: "0.1.1-beta.9",
      status: "downloaded",
    });

    render(<UpdateButton />);

    await waitFor(() => {
      expect(sonnerState.toastMock).toHaveBeenCalledWith(
        "Update ready",
        expect.objectContaining({
          action: expect.objectContaining({
            label: "Restart to update",
          }),
          cancel: expect.objectContaining({
            label: "Dismiss",
          }),
          description: "Version 0.1.1-beta.9 is ready",
          id: "app-update",
        })
      );
    });

    const action = sonnerState.toastMock.mock.calls.at(-1)?.[1]
      ?.action as ToastAction;

    act(() => {
      action.onClick({} as never);
    });

    await waitFor(() => {
      expect(updater.installUpdate.mock.calls).toHaveLength(1);
    });
  });

  it("shows a new toast after dismissing a different available version", async () => {
    sonnerState.toastMock.mockClear();
    sonnerState.dismissToastMock.mockClear();
    sonnerState.messageToastMock.mockClear();
    const updater = setUpdaterState({
      ...IDLE_UPDATE_STATE,
      availableVersion: "0.1.1-beta.10",
      status: "available",
    });

    render(<UpdateButton />);

    await waitFor(() => {
      expect(sonnerState.toastMock).toHaveBeenCalledWith(
        "Update available",
        expect.objectContaining({
          description: "Version 0.1.1-beta.10 is available",
        })
      );
    });

    const cancel = sonnerState.toastMock.mock.calls.at(-1)?.[1]
      ?.cancel as ToastAction;

    act(() => {
      cancel.onClick({} as never);
    });

    act(() => {
      updater.emitStateChange({
        ...IDLE_UPDATE_STATE,
        availableVersion: "0.1.1-beta.11",
        status: "available",
      });
    });

    await waitFor(() => {
      expect(sonnerState.toastMock).toHaveBeenCalledWith(
        "Update available",
        expect.objectContaining({
          description: "Version 0.1.1-beta.11 is available",
        })
      );
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
      expect(updater.getState.mock.calls).toHaveLength(1);
    });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
