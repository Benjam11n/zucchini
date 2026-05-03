// @vitest-environment jsdom

import { act, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import type { ExternalToast } from "sonner";

import { STORAGE_KEYS } from "@/renderer/shared/lib/storage";
import {
  IDLE_UPDATE_STATE,
  setUpdaterState,
} from "@/test/fixtures/updater-api-mock";

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

describe("update button", () => {
  beforeEach(() => {
    storage.clear();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: localStorageMock,
    });
  });

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

  it("persists a dismissed release version and hides the toast after remount", async () => {
    sonnerState.toastMock.mockClear();
    sonnerState.dismissToastMock.mockClear();
    const updater = setUpdaterState({
      ...IDLE_UPDATE_STATE,
      availableVersion: "0.1.1-beta.10",
      status: "available",
    });

    const rendered = render(<UpdateButton />);

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

    expect(localStorage.getItem(STORAGE_KEYS.updateToastDismissal)).toBe(
      JSON.stringify({
        dismissedVersion: "0.1.1-beta.10",
      })
    );

    rendered.unmount();
    sonnerState.toastMock.mockClear();

    render(<UpdateButton />);

    await waitFor(() => {
      expect(updater.getState.mock.calls.length).toBeGreaterThan(1);
    });

    expect(sonnerState.toastMock).not.toHaveBeenCalledWith(
      "Update available",
      expect.anything()
    );
  });

  it("does not re-toast the same release after dismissal when the updater state changes", async () => {
    sonnerState.toastMock.mockClear();
    sonnerState.dismissToastMock.mockClear();
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

    sonnerState.toastMock.mockClear();

    act(() => {
      updater.emitStateChange({
        ...IDLE_UPDATE_STATE,
        availableVersion: "0.1.1-beta.10",
        status: "downloaded",
      });
    });

    await waitFor(() => {
      expect(updater.onStateChange).toHaveBeenCalledTimes(1);
    });

    expect(sonnerState.toastMock).not.toHaveBeenCalled();
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
