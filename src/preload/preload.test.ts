import type { HabitApi, TodayState } from "@/shared/contracts/habits-ipc";

const exposed = new Map<string, unknown>();
const invoke = vi.fn();

vi.mock("electron", () => ({
  contextBridge: {
    exposeInMainWorld: vi.fn((key: string, value: unknown) => {
      exposed.set(key, value);
    }),
  },
  ipcRenderer: {
    invoke,
  },
}));

describe("preload habits API", () => {
  beforeEach(async () => {
    exposed.clear();
    invoke.mockReset();
    vi.resetModules();
    await import("./preload");
  });

  function getHabitsApi(): HabitApi {
    return exposed.get("habits") as HabitApi;
  }

  it("returns data for successful IPC responses", async () => {
    const todayState = {
      date: "2026-03-08",
      habits: [],
      settings: {
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

    await expect(getHabitsApi().getTodayState()).resolves.toEqual(todayState);
  });

  it("throws HabitsIpcError instances for error responses", async () => {
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
});
