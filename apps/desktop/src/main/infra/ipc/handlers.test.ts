import type * as ElectronModule from "electron";
import type { IpcMain, IpcMainInvokeEvent } from "electron";

import type * as NotificationsModule from "@/main/features/reminders/notifications";
import { DatabaseError } from "@/main/infra/db/sqlite-client";
import { HABITS_IPC_CHANNELS } from "@/shared/contracts/habits-ipc";
import { FOCUS_TIMER_SHORTCUT_DEFAULTS } from "@/shared/contracts/keyboard-shortcuts";
import type { AppSettings } from "@/shared/domain/settings";

import { registerIpcHandlers } from "./handlers";

const handlers = new Map<
  string,
  (_event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
>();

vi.mock<typeof ElectronModule>(import("electron"), async (importOriginal) => {
  const actual = await importOriginal();

  return {
    ...actual,
    ipcMain: {
      ...actual.ipcMain,
      handle: vi.fn(
        (channel: string, handler: (...args: unknown[]) => unknown) => {
          handlers.set(
            channel,
            handler as (
              _event: IpcMainInvokeEvent,
              ...args: unknown[]
            ) => Promise<unknown>
          );
        }
      ),
    } as IpcMain,
  };
});

vi.mock<typeof NotificationsModule>(
  import("@/main/features/reminders/notifications"),
  () => ({
    getDesktopNotificationStatus: vi.fn(() =>
      Promise.resolve({
        availability: "available" as const,
        reason: null,
      })
    ),
    showDesktopNotification: vi.fn(),
  })
);

const defaultSettings: AppSettings = {
  focusCyclesBeforeLongBreak: 4,
  focusDefaultDurationSeconds: 1500,
  focusLongBreakSeconds: 15 * 60,
  focusShortBreakSeconds: 5 * 60,
  launchAtLogin: false,
  minimizeToTray: false,
  reminderEnabled: true,
  reminderSnoozeMinutes: 15,
  reminderTime: "20:30",
  resetFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
  themeMode: "system",
  timezone: "Asia/Singapore",
  toggleFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
};

function createService() {
  return {
    archiveHabit: vi.fn(),
    createHabit: vi.fn(),
    getFocusSessions: vi.fn(() => []),
    getHabits: vi.fn(() => []),
    getHistory: vi.fn(() => []),
    getReminderRuntimeState: vi.fn(),
    getTodayState: vi.fn(() => {
      throw new Error("boom");
    }),
    getWeeklyReview: vi.fn(),
    getWeeklyReviewOverview: vi.fn(() => ({
      availableWeeks: [],
      latestReview: null,
      trend: [],
    })),
    initialize: vi.fn(),
    recordFocusSession: vi.fn(),
    renameHabit: vi.fn(),
    reorderHabits: vi.fn(),
    saveReminderRuntimeState: vi.fn(),
    toggleHabit: vi.fn(),
    unarchiveHabit: vi.fn(),
    updateHabitCategory: vi.fn(),
    updateHabitFrequency: vi.fn(),
    updateHabitWeekdays: vi.fn(),
    updateSettings: vi.fn(() => defaultSettings),
  };
}

function createFocusTimerCoordinator() {
  return {
    claimCycleCompletion: vi.fn(() => true),
    claimLeadership: vi.fn(() => true),
    releaseLeadership: vi.fn(),
  };
}

function createRegisterOptions(
  overrides: Partial<Parameters<typeof registerIpcHandlers>[0]> = {}
): Parameters<typeof registerIpcHandlers>[0] {
  return {
    broadcastFocusSessionRecorded: vi.fn(),
    focusTimerCoordinator: createFocusTimerCoordinator(),
    getFocusTimerShortcutStatus: vi.fn(() => ({
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
    })),
    onExportBackup: vi.fn(() => Promise.resolve(null)),
    onImportBackup: vi.fn(() => Promise.resolve(false)),
    onOpenDataFolder: vi.fn(() => Promise.resolve("/tmp/zucchini")),
    onResizeFocusWidget: vi.fn(),
    onSettingsChanged: vi.fn(),
    onShowFocusWidget: vi.fn(),
    onShowMainWindow: vi.fn(),
    service: createService(),
    ...overrides,
  };
}

describe("registerIpcHandlers()", () => {
  function resetHandlers(): void {
    handlers.clear();
  }

  it("serializes validation errors with details", async () => {
    resetHandlers();
    registerIpcHandlers(createRegisterOptions());

    const handler = handlers.get(HABITS_IPC_CHANNELS.toggleHabit);

    await expect(
      handler?.({} as IpcMainInvokeEvent, "bad-id")
    ).resolves.toStrictEqual(
      expect.objectContaining({
        error: expect.objectContaining({
          code: "VALIDATION_ERROR",
          details: expect.any(Array),
        }),
        ok: false,
      })
    );
  });

  it("serializes database errors with a safe message", async () => {
    resetHandlers();
    const service = createService();
    service.getTodayState.mockImplementation(() => {
      throw new DatabaseError("getTodayState", new Error("sqlite locked"));
    });

    registerIpcHandlers(createRegisterOptions({ service }));

    const handler = handlers.get(HABITS_IPC_CHANNELS.getTodayState);

    await expect(handler?.({} as IpcMainInvokeEvent)).resolves.toStrictEqual({
      error: {
        code: "DATABASE_ERROR",
        message: "Zucchini could not access its local data.",
      },
      ok: false,
    });
  });

  it("serializes unknown errors as internal errors", async () => {
    resetHandlers();
    registerIpcHandlers(createRegisterOptions());

    const handler = handlers.get(HABITS_IPC_CHANNELS.getTodayState);

    await expect(handler?.({} as IpcMainInvokeEvent)).resolves.toStrictEqual({
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong while processing your request.",
      },
      ok: false,
    });
  });

  it("passes validated history limits through to the service", async () => {
    resetHandlers();
    const service = createService();

    registerIpcHandlers(createRegisterOptions({ service }));

    const handler = handlers.get(HABITS_IPC_CHANNELS.getHistory);

    await expect(
      handler?.({} as IpcMainInvokeEvent, 14)
    ).resolves.toStrictEqual({
      data: [],
      ok: true,
    });
    expect(service.getHistory).toHaveBeenCalledWith(14);
  });

  it("returns desktop notification status through IPC", async () => {
    resetHandlers();
    registerIpcHandlers(createRegisterOptions());

    const handler = handlers.get(
      HABITS_IPC_CHANNELS.getDesktopNotificationStatus
    );

    await expect(handler?.({} as IpcMainInvokeEvent)).resolves.toStrictEqual({
      data: {
        availability: "available",
        reason: null,
      },
      ok: true,
    });
  });

  it("returns focus timer shortcut status through IPC", async () => {
    resetHandlers();
    registerIpcHandlers(createRegisterOptions());

    await expect(
      handlers.get(HABITS_IPC_CHANNELS.getFocusTimerShortcutStatus)?.(
        {} as IpcMainInvokeEvent
      )
    ).resolves.toStrictEqual({
      data: {
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
      },
      ok: true,
    });
  });

  it("passes validated focus session payloads through to the service", async () => {
    resetHandlers();
    const service = createService();
    const broadcastFocusSessionRecorded = vi.fn();
    service.recordFocusSession.mockReturnValue({
      completedAt: "2026-03-08T09:25:00.000Z",
      completedDate: "2026-03-08",
      durationSeconds: 1500,
      entryKind: "completed",
      id: 1,
      startedAt: "2026-03-08T09:00:00.000Z",
      timerSessionId: "timer-session-1",
    });

    registerIpcHandlers(
      createRegisterOptions({
        broadcastFocusSessionRecorded,
        service,
      })
    );

    const handler = handlers.get(HABITS_IPC_CHANNELS.recordFocusSession);
    const payload = {
      completedAt: "2026-03-08T09:25:00.000Z",
      completedDate: "2026-03-08",
      durationSeconds: 1500,
      entryKind: "completed",
      startedAt: "2026-03-08T09:00:00.000Z",
      timerSessionId: "timer-session-1",
    };

    await expect(
      handler?.({} as IpcMainInvokeEvent, payload)
    ).resolves.toStrictEqual({
      data: {
        ...payload,
        id: 1,
      },
      ok: true,
    });
    expect(service.recordFocusSession).toHaveBeenCalledWith(payload);
    expect(broadcastFocusSessionRecorded).toHaveBeenCalledWith({
      ...payload,
      id: 1,
    });
  });

  it("routes focus timer leadership requests to the coordinator", async () => {
    resetHandlers();
    const focusTimerCoordinator = createFocusTimerCoordinator();

    registerIpcHandlers(createRegisterOptions({ focusTimerCoordinator }));

    const handler = handlers.get(HABITS_IPC_CHANNELS.claimFocusTimerLeadership);

    await expect(
      handler?.({} as IpcMainInvokeEvent, "widget-1", 2500)
    ).resolves.toStrictEqual({
      data: true,
      ok: true,
    });
    expect(focusTimerCoordinator.claimLeadership).toHaveBeenCalledWith(
      "widget-1",
      2500
    );
  });

  it("routes the open data folder action to the provided callback", async () => {
    resetHandlers();
    const onOpenDataFolder = vi.fn(() => Promise.resolve("/tmp/zucchini"));

    registerIpcHandlers(
      createRegisterOptions({
        onOpenDataFolder,
      })
    );

    await expect(
      handlers.get(HABITS_IPC_CHANNELS.openDataFolder)?.(
        {} as IpcMainInvokeEvent
      )
    ).resolves.toStrictEqual({
      data: "/tmp/zucchini",
      ok: true,
    });
    expect(onOpenDataFolder.mock.calls).toHaveLength(1);
  });

  it("routes the export backup action to the provided callback", async () => {
    resetHandlers();
    const onExportBackup = vi.fn(() =>
      Promise.resolve("/tmp/zucchini-backup.db")
    );

    registerIpcHandlers(
      createRegisterOptions({
        onExportBackup,
      })
    );

    await expect(
      handlers.get(HABITS_IPC_CHANNELS.exportBackup)?.({} as IpcMainInvokeEvent)
    ).resolves.toStrictEqual({
      data: "/tmp/zucchini-backup.db",
      ok: true,
    });
    expect(onExportBackup.mock.calls).toHaveLength(1);
  });

  it("routes the import backup action to the provided callback", async () => {
    resetHandlers();
    const onImportBackup = vi.fn(() => Promise.resolve(true));

    registerIpcHandlers(
      createRegisterOptions({
        onImportBackup,
      })
    );

    await expect(
      handlers.get(HABITS_IPC_CHANNELS.importBackup)?.({} as IpcMainInvokeEvent)
    ).resolves.toStrictEqual({
      data: true,
      ok: true,
    });
    expect(onImportBackup.mock.calls).toHaveLength(1);
  });
});
