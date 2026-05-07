import type * as ElectronModule from "electron";
import type { IpcMain, IpcMainInvokeEvent } from "electron";

import type * as NotificationsModule from "@/main/features/reminders/notifications";
import { DatabaseError } from "@/main/ports/database-error";
import { HABITS_IPC_CHANNELS } from "@/shared/contracts/habits-ipc-channels";
import type { PersistedFocusTimerState } from "@/shared/domain/focus-timer";
import { FOCUS_TIMER_SHORTCUT_DEFAULTS } from "@/shared/domain/keyboard-shortcuts";
import { createDefaultAppSettings } from "@/shared/domain/settings";
import type { AppSettings } from "@/shared/domain/settings";

import { registerIpcHandlers } from "./handlers";

const handlers = new Map<
  string,
  (_event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
>();

vi.mock<typeof ElectronModule>(import("electron"), async (importOriginal) => {
  const actual = await importOriginal();

  // oxlint-disable-next-line eslint/sort-keys
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
  ...createDefaultAppSettings("Asia/Singapore"),
  resetFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
  toggleFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
};

/* oxlint-disable eslint/sort-keys */
function createService() {
  const focusTimerState: PersistedFocusTimerState = {
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

  return {
    archiveFocusQuotaGoal: vi.fn(),
    archiveHabit: vi.fn(),
    createHabit: vi.fn(),
    createWindDownAction: vi.fn(),
    decrementHabitProgress: vi.fn(),
    deleteWindDownAction: vi.fn(),
    execute: vi.fn(),
    getFocusSessions: vi.fn(() => []),
    getHabits: vi.fn(() => []),
    getHistory: vi.fn(() => []),
    getHistoryDay: vi.fn(),
    getHistoryForYear: vi.fn(() => []),
    getHistorySummary: vi.fn(() => []),
    getHistoryYears: vi.fn(() => []),
    getPersistedFocusTimerState: vi.fn(() => focusTimerState),
    getReminderRuntimeState: vi.fn(),
    getTodayState: vi.fn(() => {
      throw new Error("boom");
    }),
    getWindDownRuntimeState: vi.fn(),
    getWeeklyReview: vi.fn(),
    getWeeklyReviewOverview: vi.fn(() => ({
      availableWeeks: [],
      latestReview: null,
      trend: [],
    })),
    incrementHabitProgress: vi.fn(),
    initialize: vi.fn(),
    moveUnfinishedHabitsToTomorrow: vi.fn(),
    recordFocusSession: vi.fn(),
    read: vi.fn(),
    renameHabit: vi.fn(),
    renameWindDownAction: vi.fn(),
    reorderHabits: vi.fn(),
    savePersistedFocusTimerState: vi.fn((state) => state),
    saveReminderRuntimeState: vi.fn(),
    saveWindDownRuntimeState: vi.fn(),
    setDayStatus: vi.fn(),
    toggleHabitCarryover: vi.fn(),
    toggleSickDay: vi.fn(),
    toggleHabit: vi.fn(),
    toggleWindDownAction: vi.fn(),
    unarchiveFocusQuotaGoal: vi.fn(),
    unarchiveHabit: vi.fn(),
    upsertFocusQuotaGoal: vi.fn(),
    updateHabitCategory: vi.fn(),
    updateHabitFrequency: vi.fn(),
    updateHabitTargetCount: vi.fn(),
    updateHabitWeekdays: vi.fn(),
    updateSettings: vi.fn(() => defaultSettings),
  };
}
/* oxlint-enable eslint/sort-keys */

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
    broadcastFocusTimerStateChanged: vi.fn(),
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
    onClearData: vi.fn(() => Promise.resolve(true)),
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

    const handler = handlers.get(HABITS_IPC_CHANNELS.command);

    await expect(
      handler?.({} as IpcMainInvokeEvent, {
        payload: { habitId: "bad-id" },
        type: "habit.toggle",
      })
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
    service.read.mockImplementation(() => {
      throw new DatabaseError("getTodayState", new Error("sqlite locked"));
    });

    registerIpcHandlers(createRegisterOptions({ service }));

    const handler = handlers.get(HABITS_IPC_CHANNELS.query);

    await expect(
      handler?.({} as IpcMainInvokeEvent, { type: "today.get" })
    ).resolves.toStrictEqual({
      error: {
        code: "DATABASE_ERROR",
        message: "Zucchini could not access its local data.",
      },
      ok: false,
    });
  });

  it("serializes unknown errors as internal errors", async () => {
    resetHandlers();
    const service = createService();
    service.read.mockImplementation(() => {
      throw new Error("boom");
    });

    registerIpcHandlers(createRegisterOptions({ service }));

    const handler = handlers.get(HABITS_IPC_CHANNELS.query);

    await expect(
      handler?.({} as IpcMainInvokeEvent, { type: "today.get" })
    ).resolves.toStrictEqual({
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

    service.read.mockReturnValue([]);

    const handler = handlers.get(HABITS_IPC_CHANNELS.query);

    await expect(
      handler?.({} as IpcMainInvokeEvent, {
        payload: { limit: 14 },
        type: "history.get",
      })
    ).resolves.toStrictEqual({
      data: [],
      ok: true,
    });
    expect(service.read).toHaveBeenCalledWith({
      payload: { limit: 14 },
      type: "history.get",
    });
  });

  it("routes validated habit queries through the command/query boundary", async () => {
    resetHandlers();
    const service = createService();
    service.read.mockReturnValue([]);

    registerIpcHandlers(createRegisterOptions({ service }));

    const handler = handlers.get(HABITS_IPC_CHANNELS.query);

    await expect(
      handler?.({} as IpcMainInvokeEvent, {
        payload: { limit: 14 },
        type: "history.get",
      })
    ).resolves.toStrictEqual({
      data: [],
      ok: true,
    });
    expect(service.read).toHaveBeenCalledWith({
      payload: { limit: 14 },
      type: "history.get",
    });
  });

  it("routes habit commands through the command/query boundary and broadcasts side effects", async () => {
    resetHandlers();
    const service = createService();
    const broadcastFocusSessionRecorded = vi.fn();
    const payload = {
      completedAt: "2026-03-08T09:25:00.000Z",
      completedDate: "2026-03-08",
      durationSeconds: 1500,
      entryKind: "completed",
      startedAt: "2026-03-08T09:00:00.000Z",
      timerSessionId: "timer-session-1",
    };
    const focusSession = {
      ...payload,
      id: 1,
    };
    service.execute.mockReturnValue(focusSession);

    registerIpcHandlers(
      createRegisterOptions({
        broadcastFocusSessionRecorded,
        service,
      })
    );

    const handler = handlers.get(HABITS_IPC_CHANNELS.command);

    await expect(
      handler?.({} as IpcMainInvokeEvent, {
        payload,
        type: "focusSession.record",
      })
    ).resolves.toStrictEqual({
      data: focusSession,
      ok: true,
    });
    expect(service.execute).toHaveBeenCalledWith({
      payload,
      type: "focusSession.record",
    });
    expect(broadcastFocusSessionRecorded).toHaveBeenCalledWith(focusSession);
  });

  it("rejects invalid command payloads before they reach the service", async () => {
    resetHandlers();
    const service = createService();

    registerIpcHandlers(createRegisterOptions({ service }));

    const handler = handlers.get(HABITS_IPC_CHANNELS.command);

    await expect(
      handler?.({} as IpcMainInvokeEvent, {
        payload: { frequency: "yearly", targetMinutes: 20_000 },
        type: "focusQuotaGoal.upsert",
      })
    ).resolves.toStrictEqual(
      expect.objectContaining({
        error: expect.objectContaining({
          code: "VALIDATION_ERROR",
        }),
        ok: false,
      })
    );
    expect(service.execute).not.toHaveBeenCalled();
  });

  it("rejects focus quota targets outside the selected cadence bounds", async () => {
    resetHandlers();
    const service = createService();

    registerIpcHandlers(createRegisterOptions({ service }));

    const handler = handlers.get(HABITS_IPC_CHANNELS.command);

    await expect(
      handler?.({} as IpcMainInvokeEvent, {
        payload: { frequency: "weekly", targetMinutes: 20_000 },
        type: "focusQuotaGoal.upsert",
      })
    ).resolves.toStrictEqual(
      expect.objectContaining({
        error: expect.objectContaining({
          code: "VALIDATION_ERROR",
          details: expect.arrayContaining([
            "payload.targetMinutes: Focus quota target minutes for weekly goals must be between 30 and 10,080 minutes.",
          ]),
        }),
        ok: false,
      })
    );
    expect(service.execute).not.toHaveBeenCalled();
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
    service.execute.mockReturnValue({
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

    const handler = handlers.get(HABITS_IPC_CHANNELS.command);
    const payload = {
      completedAt: "2026-03-08T09:25:00.000Z",
      completedDate: "2026-03-08",
      durationSeconds: 1500,
      entryKind: "completed",
      startedAt: "2026-03-08T09:00:00.000Z",
      timerSessionId: "timer-session-1",
    };

    await expect(
      handler?.({} as IpcMainInvokeEvent, {
        payload,
        type: "focusSession.record",
      })
    ).resolves.toStrictEqual({
      data: {
        ...payload,
        id: 1,
      },
      ok: true,
    });
    expect(service.execute).toHaveBeenCalledWith({
      payload,
      type: "focusSession.record",
    });
    expect(broadcastFocusSessionRecorded).toHaveBeenCalledWith({
      ...payload,
      id: 1,
    });
  });

  it("saves focus timer state and broadcasts the normalized snapshot", async () => {
    resetHandlers();
    const service = createService();
    const broadcastFocusTimerStateChanged = vi.fn();
    const nextState: PersistedFocusTimerState = {
      breakVariant: null,
      completedFocusCycles: 1,
      cycleId: "cycle-1",
      endsAt: "2026-03-08T09:25:00.000Z",
      focusDurationMs: 1500 * 1000,
      lastCompletedBreak: null,
      lastUpdatedAt: "2026-03-08T09:00:00.000Z",
      phase: "focus",
      remainingMs: 1500 * 1000,
      startedAt: "2026-03-08T09:00:00.000Z",
      status: "running",
      timerSessionId: "timer-session-1",
    };
    service.execute.mockReturnValue(nextState);

    registerIpcHandlers(
      createRegisterOptions({
        broadcastFocusTimerStateChanged,
        service,
      })
    );

    await expect(
      handlers.get(HABITS_IPC_CHANNELS.command)?.({} as IpcMainInvokeEvent, {
        payload: nextState,
        type: "focusTimer.saveState",
      })
    ).resolves.toStrictEqual({
      data: nextState,
      ok: true,
    });

    expect(service.execute).toHaveBeenCalledWith({
      payload: nextState,
      type: "focusTimer.saveState",
    });
    expect(broadcastFocusTimerStateChanged).toHaveBeenCalledWith(nextState);
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

  it("routes the clear data action to the provided callback", async () => {
    resetHandlers();
    const onClearData = vi.fn(() => Promise.resolve(true));

    registerIpcHandlers(
      createRegisterOptions({
        onClearData,
      })
    );

    await expect(
      handlers.get(HABITS_IPC_CHANNELS.clearData)?.({} as IpcMainInvokeEvent)
    ).resolves.toStrictEqual({
      data: true,
      ok: true,
    });
    expect(onClearData.mock.calls).toHaveLength(1);
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
