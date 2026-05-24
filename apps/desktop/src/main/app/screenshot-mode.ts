import { once } from "node:events";
import fs from "node:fs";
import path from "node:path";

import type { App, BrowserWindow } from "electron";

import type { HabitsApplicationService } from "@/main/features/habits/habits-application-service";
import type { AppRepository } from "@/main/ports/app-repository";
import { addDays } from "@/shared/utils/date";

interface ScreenshotModeConfig {
  databasePath: string | null;
  outputPath: string | null;
  userDataPath: string | null;
}

interface CaptureMarketingScreenshotOptions {
  app: App;
  log: {
    error: (message: string, error?: unknown) => void;
    info: (message: string, details?: unknown) => void;
  };
  window: BrowserWindow;
}

const SCREENSHOT_READY_SCRIPT = `
new Promise((resolve) => {
  const timeout = window.setTimeout(() => {
    resolve(false);
  }, 15000);

  const settle = () => {
    const waitForFonts =
      document.fonts && typeof document.fonts.ready?.then === "function"
        ? document.fonts.ready
        : Promise.resolve();

    waitForFonts.then(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.clearTimeout(timeout);
          resolve(true);
        });
      });
    });
  };

  const check = () => {
    if (document.querySelector("[data-screenshot-ready='true']")) {
      settle();
      return;
    }

    window.setTimeout(check, 100);
  };

  check();
});
`;

const MARKETING_HABITS = [
  { category: "nutrition", name: "Prep lunch", targetCount: 1 },
  { category: "productivity", name: "Deep work block", targetCount: 3 },
  { category: "fitness", name: "Morning walk", targetCount: 1 },
  { category: "nutrition", name: "Hydrate", targetCount: 4 },
  { category: "productivity", name: "Plan tomorrow", targetCount: 1 },
  { category: "fitness", name: "Stretch", targetCount: 1 },
  { category: "nutrition", name: "Eat zucchini", targetCount: 1 },
] as const;

const COMPLETED_MARKETING_HABITS = new Map<string, number>([
  ["Eat zucchini", 1],
  ["Prep lunch", 1],
  ["Deep work block", 2],
  ["Morning walk", 1],
  ["Hydrate", 3],
]);

const HISTORY_COMPLETION_PATTERN = [1, 0.85, 0.7, 1, 0.55, 0.85, 0.4] as const;

export function getScreenshotModeConfig(): ScreenshotModeConfig {
  return {
    databasePath: process.env["ZUCCHINI_SCREENSHOT_DB_PATH"] ?? null,
    outputPath: process.env["ZUCCHINI_SCREENSHOT_OUTPUT_PATH"] ?? null,
    userDataPath: process.env["ZUCCHINI_SCREENSHOT_USER_DATA_PATH"] ?? null,
  };
}

export function isScreenshotMode(): boolean {
  return process.env["ZUCCHINI_SCREENSHOT_MODE"] === "1";
}

async function waitForMainWindowLoad(window: BrowserWindow): Promise<void> {
  if (!window.webContents.isLoading()) {
    return;
  }

  const loadFailed = async () => {
    const [, code, description] = await once(
      window.webContents,
      "did-fail-load"
    );
    throw new Error(`Window load failed (${code}): ${description}`);
  };

  await Promise.race([
    once(window.webContents, "did-finish-load"),
    loadFailed(),
  ]);
}

export function configureScreenshotUserDataPath(app: App): void {
  const { userDataPath } = getScreenshotModeConfig();

  if (!isScreenshotMode() || !userDataPath) {
    return;
  }

  fs.mkdirSync(userDataPath, { recursive: true });
  app.setPath("userData", userDataPath);
}

function seedMarketingHistory(
  repository: AppRepository,
  todayDate: string,
  habits: ReturnType<HabitsApplicationService["getTodayState"]>["habits"]
): void {
  const dailyHabits = habits.filter((habit) => habit.frequency === "daily");

  for (let offset = 1; offset <= 14; offset += 1) {
    const date = addDays(todayDate, -offset);
    const completionRatio =
      HISTORY_COMPLETION_PATTERN[
        (offset - 1) % HISTORY_COMPLETION_PATTERN.length
      ] ?? 1;
    const completedHabits = Math.max(
      1,
      Math.round(dailyHabits.length * completionRatio)
    );
    const completedAt = `${date}T21:00:00.000Z`;

    repository.ensureStatusRowsForDate(date);
    for (const [index, habit] of dailyHabits.entries()) {
      const completedCount =
        index < completedHabits ? (habit.targetCount ?? 1) : 0;
      repository.setHabitProgress(date, habit.id, completedCount);
    }
    repository.saveDailySummary({
      allCompleted: completedHabits === dailyHabits.length,
      completedAt: completedHabits === dailyHabits.length ? completedAt : null,
      date,
      dayStatus: null,
      freezeUsed: completionRatio < 0.7,
      streakCountAfterDay: completionRatio >= 0.7 ? 6 - (offset % 3) : 0,
    });

    if (offset <= 7) {
      repository.saveFocusSession({
        completedAt: `${date}T10:30:00.000Z`,
        completedDate: date,
        durationSeconds: (offset % 3 === 0 ? 45 : 30) * 60,
        entryKind: "completed",
        startedAt: `${date}T10:00:00.000Z`,
        timerSessionId: `marketing-history-${date}`,
      });
    }
  }
}

export function seedMarketingScreenshotData({
  repository,
  service,
}: {
  repository: AppRepository;
  service: HabitsApplicationService;
}): void {
  if (!isScreenshotMode() || service.getHabits().length > 0) {
    return;
  }

  let todayState = service.getTodayState();
  for (const habit of MARKETING_HABITS) {
    todayState = service.createHabit(
      habit.name,
      habit.category,
      "daily",
      null,
      habit.targetCount
    );
  }

  for (const [name, count] of COMPLETED_MARKETING_HABITS) {
    const habit = todayState.habits.find(
      (candidate) => candidate.name === name
    );
    if (!habit) {
      continue;
    }

    repository.setHabitProgress(todayState.date, habit.id, count);
  }

  service.upsertFocusQuotaGoal("weekly", 450);
  seedMarketingHistory(repository, todayState.date, todayState.habits);
}

export async function captureMarketingScreenshot({
  app,
  log,
  window,
}: CaptureMarketingScreenshotOptions): Promise<void> {
  const { outputPath } = getScreenshotModeConfig();

  if (!outputPath) {
    throw new Error("Missing ZUCCHINI_SCREENSHOT_OUTPUT_PATH.");
  }

  await waitForMainWindowLoad(window);
  const isReady = await window.webContents.executeJavaScript(
    SCREENSHOT_READY_SCRIPT,
    true
  );
  if (isReady !== true) {
    throw new Error(
      "Timed out waiting for marketing screenshot readiness marker."
    );
  }

  window.show();
  window.focus();
  const image = await window.webContents.capturePage();
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, image.toPNG());
  log.info("Captured marketing screenshot.", { outputPath });

  app.quit();
}
