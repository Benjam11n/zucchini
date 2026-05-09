import type * as ElectronModule from "electron";
import type { ContextBridge, IpcRenderer } from "electron";

import type { AppUpdaterApi } from "@/shared/contracts/app-updater";
import type {
  DesktopNotificationStatus,
  FocusTimerActionRequest,
  FocusTimerShortcutStatus,
  HabitsApi,
} from "@/shared/contracts/habits-api";
import type { TodayState } from "@/shared/contracts/today-state";
import type { FocusSession } from "@/shared/domain/focus-session";
import type { PersistedFocusTimerState } from "@/shared/domain/focus-timer";
import { FOCUS_TIMER_SHORTCUT_DEFAULTS } from "@/shared/domain/keyboard-shortcuts";
import { createDefaultAppSettings } from "@/shared/domain/settings";

const exposed = new Map<string, unknown>();
const invoke = vi.fn();
const on = vi.fn();
const removeListener = vi.fn();

vi.mock<typeof ElectronModule>(import("electron"), () => {
  const contextBridge = {
    exposeInMainWorld: vi.fn((key: string, value: unknown) => {
      exposed.set(key, value);
    }),
  } as unknown as ContextBridge;

  const ipcRenderer = {
    invoke,
    on,
    removeListener,
  } as unknown as IpcRenderer;

  return {
    contextBridge,
    ipcRenderer,
  };
});

describe("preload habits API", () => {
  async function loadPreloadModule(): Promise<void> {
    exposed.clear();
    invoke.mockReset();
    on.mockReset();
    removeListener.mockReset();
    vi.resetModules();
    await import("./preload");
  }

  function getHabitsApi(): HabitsApi {
    return exposed.get("habits") as HabitsApi;
  }

  function getUpdaterApi(): AppUpdaterApi {
    return exposed.get("updater") as AppUpdaterApi;
  }

  it("returns data for successful IPC responses", async () => {
    await loadPreloadModule();
    const todayState = {
      date: "2026-03-08",
      dayStatus: null,
      focusMinutes: 0,
      habits: [],
      settings: {
        ...createDefaultAppSettings("Asia/Singapore"),
        resetFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
        toggleFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
      },
      streak: {
        availableFreezes: 1,
        bestStreak: 3,
        currentStreak: 3,
        lastEvaluatedDate: "2026-03-07",
      },
    } satisfies TodayState;

    invoke.mockResolvedValue({
      data: todayState,
      ok: true,
    });

    await expect(
      getHabitsApi().query({ type: "today.get" })
    ).resolves.toStrictEqual(todayState);
  });

  it("throws HabitsIpcError instances for error responses", async () => {
    await loadPreloadModule();
    invoke.mockResolvedValue({
      error: {
        code: "VALIDATION_ERROR",
        details: ["habitId: Invalid input"],
        message: "Invalid payload for habit id.",
      },
      ok: false,
    });

    await expect(
      getHabitsApi().query({ type: "today.get" })
    ).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
      details: ["habitId: Invalid input"],
      message: "Invalid payload for habit id.",
      name: "HabitsIpcError",
    });
  });

  it("exposes focus session subscriptions through the preload bridge", async () => {
    await loadPreloadModule();

    const listener = vi.fn();
    const unsubscribe = getHabitsApi().onFocusSessionRecorded(listener);

    expect(on.mock.calls).toHaveLength(1);

    const [channel, handler] = on.mock.calls[0] as [
      string,
      (_event: object, session: FocusSession) => void,
    ];

    expect(channel).toBe("habits:focusSessionRecorded");

    handler(
      {},
      {
        completedAt: "2026-03-08T09:25:00.000Z",
        completedDate: "2026-03-08",
        durationSeconds: 1500,
        entryKind: "completed",
        id: 7,
        startedAt: "2026-03-08T09:00:00.000Z",
        timerSessionId: "timer-session-7",
      }
    );

    expect(listener).toHaveBeenCalledWith({
      completedAt: "2026-03-08T09:25:00.000Z",
      completedDate: "2026-03-08",
      durationSeconds: 1500,
      entryKind: "completed",
      id: 7,
      startedAt: "2026-03-08T09:00:00.000Z",
      timerSessionId: "timer-session-7",
    });

    unsubscribe();

    expect(removeListener.mock.calls).toHaveLength(1);
  });

  it("exposes focus timer action subscriptions through the preload bridge", async () => {
    await loadPreloadModule();

    const listener = vi.fn();
    const unsubscribe = getHabitsApi().onFocusTimerActionRequested(listener);

    const [channel, handler] = on.mock.calls[0] as [
      string,
      (_event: object, request: FocusTimerActionRequest) => void,
    ];

    expect(channel).toBe("habits:focusTimerActionRequested");

    handler({}, { action: "toggle", source: "global-shortcut" });

    expect(listener).toHaveBeenCalledWith({
      action: "toggle",
      source: "global-shortcut",
    });

    unsubscribe();

    expect(removeListener.mock.calls).toHaveLength(1);
  });

  it("exposes focus timer shortcut status subscriptions through the preload bridge", async () => {
    await loadPreloadModule();

    const listener = vi.fn();
    const unsubscribe =
      getHabitsApi().onFocusTimerShortcutStatusChanged(listener);

    const [, handler] = on.mock.calls[0] as [
      string,
      (_event: object, status: FocusTimerShortcutStatus) => void,
    ];

    handler(
      {},
      {
        reset: {
          accelerator: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
          activeAccelerator: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
          errorMessage: null,
          isRegistered: true,
        },
        toggle: {
          accelerator: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
          activeAccelerator: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
          errorMessage: null,
          isRegistered: true,
        },
      }
    );

    expect(listener).toHaveBeenCalledWith({
      reset: {
        accelerator: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
        activeAccelerator: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
        errorMessage: null,
        isRegistered: true,
      },
      toggle: {
        accelerator: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
        activeAccelerator: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
        errorMessage: null,
        isRegistered: true,
      },
    });

    unsubscribe();

    expect(removeListener.mock.calls).toHaveLength(1);
  });

  it("exposes focus timer state subscriptions through the preload bridge", async () => {
    await loadPreloadModule();

    const listener = vi.fn();
    const unsubscribe = getHabitsApi().onFocusTimerStateChanged(listener);

    const [channel, handler] = on.mock.calls[0] as [
      string,
      (_event: object, state: PersistedFocusTimerState) => void,
    ];

    expect(channel).toBe("habits:focusTimerStateChanged");

    const timerState: PersistedFocusTimerState = {
      breakVariant: null,
      completedFocusCycles: 0,
      cycleId: null,
      endsAt: null,
      focusDurationMs: 1500 * 1000,
      lastCompletedBreak: null,
      lastUpdatedAt: "2026-03-08T09:00:00.000Z",
      phase: "focus",
      remainingMs: 1500 * 1000,
      startedAt: null,
      status: "idle",
      timerSessionId: null,
    };

    handler({}, timerState);

    expect(listener).toHaveBeenCalledWith(timerState);

    unsubscribe();

    expect(removeListener.mock.calls).toHaveLength(1);
  });

  it("exposes update status subscriptions through the preload bridge", async () => {
    await loadPreloadModule();

    const listener = vi.fn();
    const unsubscribe = getUpdaterApi().onStateChange(listener);

    expect(on.mock.calls).toHaveLength(1);

    const [, handler] = on.mock.calls[0] as [
      string,
      (
        _event: object,
        state: {
          availableVersion: string;
          currentVersion: string;
          errorMessage: string | null;
          progressPercent: number | null;
          status: "available";
        }
      ) => void,
    ];

    handler(
      {},
      {
        availableVersion: "0.2.0",
        currentVersion: "0.1.0",
        errorMessage: null,
        progressPercent: null,
        status: "available",
      }
    );

    expect(listener).toHaveBeenCalledWith({
      availableVersion: "0.2.0",
      currentVersion: "0.1.0",
      errorMessage: null,
      progressPercent: null,
      status: "available",
    });

    unsubscribe();

    expect(removeListener.mock.calls).toHaveLength(1);
  });

  it("throws AppUpdaterIpcError instances for updater error responses", async () => {
    await loadPreloadModule();

    invoke.mockResolvedValue({
      error: {
        code: "UPDATE_ERROR",
        message: "Zucchini could not complete the update action.",
      },
      ok: false,
    });

    await expect(getUpdaterApi().getState()).rejects.toMatchObject({
      code: "UPDATE_ERROR",
      message: "Zucchini could not complete the update action.",
      name: "AppUpdaterIpcError",
    });
  });

  it("invokes the manual update check through the preload bridge", async () => {
    await loadPreloadModule();
    invoke.mockResolvedValue({
      data: undefined,
      ok: true,
    });

    await expect(getUpdaterApi().checkForUpdates()).resolves.toBeUndefined();

    expect(invoke).toHaveBeenCalledWith("app-updater:check");
  });

  it("invokes export backup through the preload bridge", async () => {
    await loadPreloadModule();
    invoke.mockResolvedValue({
      data: "/tmp/zucchini-backup.db",
      ok: true,
    });

    await expect(getHabitsApi().exportBackup()).resolves.toBe(
      "/tmp/zucchini-backup.db"
    );
    expect(invoke).toHaveBeenCalledWith("habits:exportBackup");
  });

  it("invokes CSV export through the preload bridge", async () => {
    await loadPreloadModule();
    invoke.mockResolvedValue({
      data: "/tmp/zucchini-csv-export",
      ok: true,
    });

    await expect(getHabitsApi().exportCsvData()).resolves.toBe(
      "/tmp/zucchini-csv-export"
    );
    expect(invoke).toHaveBeenCalledWith("habits:exportCsvData");
  });

  it("invokes clear data through the preload bridge", async () => {
    await loadPreloadModule();
    invoke.mockResolvedValue({
      data: true,
      ok: true,
    });

    await expect(getHabitsApi().clearData()).resolves.toBeTruthy();
    expect(invoke).toHaveBeenCalledWith("habits:clearData");
  });

  it("invokes desktop notification status through the preload bridge", async () => {
    await loadPreloadModule();
    const status: DesktopNotificationStatus = {
      availability: "blocked",
      reason: "do-not-disturb",
    };
    invoke.mockResolvedValue({
      data: status,
      ok: true,
    });

    await expect(
      getHabitsApi().getDesktopNotificationStatus()
    ).resolves.toStrictEqual(status);
    expect(invoke).toHaveBeenCalledWith("habits:getDesktopNotificationStatus");
  });

  it("invokes focus timer shortcut status through the preload bridge", async () => {
    await loadPreloadModule();
    const status: FocusTimerShortcutStatus = {
      reset: {
        accelerator: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
        activeAccelerator: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
        errorMessage: null,
        isRegistered: true,
      },
      toggle: {
        accelerator: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
        activeAccelerator: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
        errorMessage: null,
        isRegistered: true,
      },
    };
    invoke.mockResolvedValue({
      data: status,
      ok: true,
    });

    await expect(getHabitsApi().getFocusTimerShortcutStatus()).resolves.toBe(
      status
    );
    expect(invoke).toHaveBeenCalledWith("habits:getFocusTimerShortcutStatus");
  });

  it("invokes open data folder through the preload bridge", async () => {
    await loadPreloadModule();
    invoke.mockResolvedValue({
      data: "/tmp/zucchini",
      ok: true,
    });

    await expect(getHabitsApi().openDataFolder()).resolves.toBe(
      "/tmp/zucchini"
    );
    expect(invoke).toHaveBeenCalledWith("habits:openDataFolder");
  });

  it("invokes import backup through the preload bridge", async () => {
    await loadPreloadModule();
    invoke.mockResolvedValue({
      data: true,
      ok: true,
    });

    await expect(getHabitsApi().importBackup()).resolves.toBeTruthy();
    expect(invoke).toHaveBeenCalledWith("habits:importBackup");
  });
});
