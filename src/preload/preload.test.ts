/* eslint-disable vitest/prefer-called-once */

import type * as ElectronModule from "electron";
import type { ContextBridge, IpcRenderer } from "electron";

import type { AppUpdaterApi } from "@/shared/contracts/app-updater";
import type { HabitApi, TodayState } from "@/shared/contracts/habits-ipc";

const exposed = new Map<string, unknown>();
const invoke = vi.fn();
const on = vi.fn();
const removeListener = vi.fn();

vi.mock<typeof ElectronModule>(import("electron"), () => ({
  contextBridge: {
    exposeInMainWorld: vi.fn((key: string, value: unknown) => {
      exposed.set(key, value);
    }),
  } as unknown as ContextBridge,
  ipcRenderer: {
    invoke,
    on,
    removeListener,
  } as unknown as IpcRenderer,
}));

describe("preload habits API", () => {
  async function loadPreloadModule(): Promise<void> {
    exposed.clear();
    invoke.mockReset();
    on.mockReset();
    removeListener.mockReset();
    vi.resetModules();
    await import("./preload");
  }

  function getHabitsApi(): HabitApi {
    return exposed.get("habits") as HabitApi;
  }

  function getUpdaterApi(): AppUpdaterApi {
    return exposed.get("updater") as AppUpdaterApi;
  }

  it("returns data for successful IPC responses", async () => {
    await loadPreloadModule();
    const todayState = {
      date: "2026-03-08",
      habits: [],
      settings: {
        focusCyclesBeforeLongBreak: 4,
        focusDefaultDurationSeconds: 1500,
        focusLongBreakSeconds: 15 * 60,
        focusShortBreakSeconds: 5 * 60,
        launchAtLogin: false,
        minimizeToTray: false,
        reminderEnabled: true,
        reminderSnoozeMinutes: 15,
        reminderTime: "20:30",
        themeMode: "system",
        timezone: "Asia/Singapore",
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

    await expect(getHabitsApi().getTodayState()).resolves.toStrictEqual(
      todayState
    );
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

    await expect(getHabitsApi().getTodayState()).rejects.toMatchObject({
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

    expect(on).toHaveBeenCalledTimes(1);

    const [channel, handler] = on.mock.calls[0] as [
      string,
      (_event: unknown, session: unknown) => void,
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

    expect(removeListener).toHaveBeenCalledTimes(1);
  });

  it("exposes update status subscriptions through the preload bridge", async () => {
    await loadPreloadModule();

    const listener = vi.fn();
    const unsubscribe = getUpdaterApi().onStateChange(listener);

    expect(on).toHaveBeenCalledTimes(1);

    const [, handler] = on.mock.calls[0] as [
      string,
      (_event: unknown, state: unknown) => void,
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

    expect(removeListener).toHaveBeenCalledTimes(1);
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
});
