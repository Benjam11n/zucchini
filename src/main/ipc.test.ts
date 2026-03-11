import type * as ElectronModule from "electron";
import type { IpcMain, IpcMainInvokeEvent } from "electron";

import { DatabaseError } from "@/main/db/sqlite-client";
import { registerIpcHandlers } from "@/main/ipc";
import { HABITS_IPC_CHANNELS } from "@/shared/contracts/habits-ipc";
import type { AppSettings } from "@/shared/domain/settings";

const handlers = new Map<
  string,
  (_event: IpcMainInvokeEvent, ...args: unknown[]) => Promise<unknown>
>();

vi.mock<typeof ElectronModule>(import("electron"), () => ({
  ipcMain: {
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
  } as unknown as IpcMain,
}));

const defaultSettings: AppSettings = {
  launchAtLogin: false,
  minimizeToTray: false,
  reminderEnabled: true,
  reminderSnoozeMinutes: 15,
  reminderTime: "20:30",
  themeMode: "system",
  timezone: "Asia/Singapore",
};

function createService() {
  return {
    applyStarterPack: vi.fn(),
    archiveHabit: vi.fn(),
    completeOnboarding: vi.fn(),
    createHabit: vi.fn(),
    getFocusSessions: vi.fn(() => []),
    getHistory: vi.fn(() => []),
    getOnboardingStatus: vi.fn(() => ({
      completedAt: null,
      isComplete: false,
    })),
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
    skipOnboarding: vi.fn(),
    toggleHabit: vi.fn(),
    updateHabitCategory: vi.fn(),
    updateHabitFrequency: vi.fn(),
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

describe("registerIpcHandlers()", () => {
  function resetHandlers(): void {
    handlers.clear();
  }

  it("serializes validation errors with details", async () => {
    resetHandlers();
    registerIpcHandlers({
      focusTimerCoordinator: createFocusTimerCoordinator(),
      onResizeFocusWidget: vi.fn(),
      onSettingsChanged: vi.fn(),
      onShowFocusWidget: vi.fn(),
      onShowMainWindow: vi.fn(),
      service: createService(),
    });

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

    registerIpcHandlers({
      focusTimerCoordinator: createFocusTimerCoordinator(),
      onResizeFocusWidget: vi.fn(),
      onSettingsChanged: vi.fn(),
      onShowFocusWidget: vi.fn(),
      onShowMainWindow: vi.fn(),
      service,
    });

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
    registerIpcHandlers({
      focusTimerCoordinator: createFocusTimerCoordinator(),
      onResizeFocusWidget: vi.fn(),
      onSettingsChanged: vi.fn(),
      onShowFocusWidget: vi.fn(),
      onShowMainWindow: vi.fn(),
      service: createService(),
    });

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

    registerIpcHandlers({
      focusTimerCoordinator: createFocusTimerCoordinator(),
      onResizeFocusWidget: vi.fn(),
      onSettingsChanged: vi.fn(),
      onShowFocusWidget: vi.fn(),
      onShowMainWindow: vi.fn(),
      service,
    });

    const handler = handlers.get(HABITS_IPC_CHANNELS.getHistory);

    await expect(
      handler?.({} as IpcMainInvokeEvent, 14)
    ).resolves.toStrictEqual({
      data: [],
      ok: true,
    });
    expect(service.getHistory).toHaveBeenCalledWith(14);
  });

  it("passes validated focus session payloads through to the service", async () => {
    resetHandlers();
    const service = createService();
    service.recordFocusSession.mockReturnValue({
      completedAt: "2026-03-08T09:25:00.000Z",
      completedDate: "2026-03-08",
      durationSeconds: 1500,
      id: 1,
      startedAt: "2026-03-08T09:00:00.000Z",
    });

    registerIpcHandlers({
      focusTimerCoordinator: createFocusTimerCoordinator(),
      onResizeFocusWidget: vi.fn(),
      onSettingsChanged: vi.fn(),
      onShowFocusWidget: vi.fn(),
      onShowMainWindow: vi.fn(),
      service,
    });

    const handler = handlers.get(HABITS_IPC_CHANNELS.recordFocusSession);
    const payload = {
      completedAt: "2026-03-08T09:25:00.000Z",
      completedDate: "2026-03-08",
      durationSeconds: 1500,
      startedAt: "2026-03-08T09:00:00.000Z",
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
  });

  it("routes focus timer leadership requests to the coordinator", async () => {
    resetHandlers();
    const focusTimerCoordinator = createFocusTimerCoordinator();

    registerIpcHandlers({
      focusTimerCoordinator,
      onResizeFocusWidget: vi.fn(),
      onSettingsChanged: vi.fn(),
      onShowFocusWidget: vi.fn(),
      onShowMainWindow: vi.fn(),
      service: createService(),
    });

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
});
