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
    archiveHabit: vi.fn(),
    createHabit: vi.fn(),
    getHistory: vi.fn(() => []),
    getReminderRuntimeState: vi.fn(),
    getTodayState: vi.fn(() => {
      throw new Error("boom");
    }),
    initialize: vi.fn(),
    renameHabit: vi.fn(),
    reorderHabits: vi.fn(),
    saveReminderRuntimeState: vi.fn(),
    toggleHabit: vi.fn(),
    updateHabitCategory: vi.fn(),
    updateHabitFrequency: vi.fn(),
    updateSettings: vi.fn(() => defaultSettings),
  };
}

describe("registerIpcHandlers()", () => {
  function resetHandlers(): void {
    handlers.clear();
  }

  it("serializes validation errors with details", async () => {
    resetHandlers();
    registerIpcHandlers({
      onSettingsChanged: vi.fn(),
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
      onSettingsChanged: vi.fn(),
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
      onSettingsChanged: vi.fn(),
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
});
