import fs from "node:fs";
import path from "node:path";

import type { ReminderRuntimeState } from "@/main/features/reminders/runtime-state";
import { runMigrations } from "@/main/infra/db/migrations";
import { schema } from "@/main/infra/db/schema";
import { SqliteDatabaseClient } from "@/main/infra/db/sqlite-client";
import type {
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";
import { getHabitPeriod } from "@/shared/domain/habit-period";
import { createDefaultAppSettings } from "@/shared/domain/settings";
import type { AppSettings } from "@/shared/domain/settings";
import type { DailySummary, StreakState } from "@/shared/domain/streak";
import { settleClosedDay } from "@/shared/domain/streak-engine";
import {
  addDays,
  parseDateKey,
  startOfWeek,
  toDateKey,
} from "@/shared/utils/date";

export type TestDataPreset = "medium" | "stress";

export interface GenerateTestDataOptions {
  outputPath?: string;
  overwrite?: boolean;
  preset?: TestDataPreset;
  seed?: number;
  timezone?: string;
  today?: string;
}

export interface GeneratedDatasetStats {
  databasePath: string;
  dailySummaryCount: number;
  focusSessionCount: number;
  habitCount: number;
  habitPeriodStatusCount: number;
  preset: TestDataPreset;
  seed: number;
  timezone: string;
  trackedDayCount: number;
}

interface PresetConfig {
  archivedHabitCount: number;
  focusSessionCount: number;
  habitCount: number;
  trackedDayCount: number;
}

interface GeneratedHabit {
  baseCompletionRate: number;
  category: HabitCategory;
  createdAt: string;
  createdDate: string;
  endDate: string;
  frequency: HabitFrequency;
  id: number;
  isArchived: boolean;
  name: string;
  selectedWeekdays: HabitWeekday[] | null;
  sortOrder: number;
}

interface StatusRow {
  completed: boolean;
  frequency: HabitFrequency;
  habitCategory: HabitCategory;
  habitCreatedAt: string;
  habitId: number;
  habitName: string;
  habitSelectedWeekdays: string | null;
  habitSortOrder: number;
  periodEnd: string;
  periodStart: string;
}

const DEFAULT_SEED = 1337;
const DEFAULT_TIMEZONE = "America/Los_Angeles";
const DEFAULT_OUTPUTS: Record<TestDataPreset, string> = {
  medium: path.resolve(
    process.cwd(),
    "src/test/fixtures/db/zucchini-medium.db"
  ),
  stress: path.resolve(
    process.cwd(),
    "src/test/fixtures/db/zucchini-stress.db"
  ),
};
const PRESET_CONFIGS: Record<TestDataPreset, PresetConfig> = {
  medium: {
    archivedHabitCount: 4,
    focusSessionCount: 4000,
    habitCount: 36,
    trackedDayCount: 730,
  },
  stress: {
    archivedHabitCount: 12,
    focusSessionCount: 20_000,
    habitCount: 120,
    trackedDayCount: 1825,
  },
};
const CATEGORY_NAME_PARTS: Record<HabitCategory, readonly string[]> = {
  fitness: [
    "Walk",
    "Mobility",
    "Stretch",
    "Lift",
    "Sprint",
    "Core",
    "Yoga",
    "Cycle",
  ],
  nutrition: [
    "Protein",
    "Veggie",
    "Hydration",
    "Meal Prep",
    "Breakfast",
    "Tea",
    "Lunch",
    "Fruit",
  ],
  productivity: [
    "Inbox",
    "Deep Work",
    "Planning",
    "Journaling",
    "Review",
    "Reading",
    "Notes",
    "Shipping",
  ],
};
const WEEKDAY_PATTERNS: readonly HabitWeekday[][] = [
  [1, 2, 3, 4, 5],
  [1, 3, 5],
  [2, 4, 6],
  [0, 2, 4],
];
const RNG_MODULUS = 4_294_967_296;

function createRng(seed: number): () => number {
  let state = Math.abs(Math.trunc(seed)) % RNG_MODULUS;

  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % RNG_MODULUS;
    return state / RNG_MODULUS;
  };
}

function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function toIsoAt(dateKey: string, hour: number, minute: number): string {
  const date = parseDateKey(dateKey);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function startOfMonth(dateKey: string): string {
  const date = parseDateKey(dateKey);
  date.setDate(1);
  return toDateKey(date);
}

function addMonths(dateKey: string, amount: number): string {
  const date = parseDateKey(dateKey);
  date.setMonth(date.getMonth() + amount, 1);
  return toDateKey(date);
}

function isScheduledOnDate(habit: GeneratedHabit, dateKey: string): boolean {
  if (habit.frequency !== "daily") {
    return true;
  }

  if (!habit.selectedWeekdays) {
    return true;
  }

  const weekday = parseDateKey(dateKey).getDay() as HabitWeekday;
  return habit.selectedWeekdays.includes(weekday);
}

function chunkValues<T>(
  items: readonly T[],
  size: number,
  insertChunk: (chunk: T[]) => void
): void {
  for (let index = 0; index < items.length; index += size) {
    insertChunk(items.slice(index, index + size));
  }
}

function buildSettings(timezone: string, preset: TestDataPreset): AppSettings {
  const defaults = createDefaultAppSettings(timezone);

  return {
    ...defaults,
    focusCyclesBeforeLongBreak: preset === "stress" ? 5 : 4,
    focusDefaultDurationSeconds: preset === "stress" ? 45 * 60 : 30 * 60,
    launchAtLogin: false,
    minimizeToTray: true,
    reminderEnabled: true,
    reminderSnoozeMinutes: preset === "stress" ? 10 : 15,
    reminderTime: preset === "stress" ? "18:45" : "19:30",
    themeMode: preset === "stress" ? "dark" : "system",
    timezone,
  };
}

function buildReminderRuntimeState(endDate: string): ReminderRuntimeState {
  return {
    lastMidnightWarningSentAt: toIsoAt(endDate, 0, 5),
    lastMissedReminderSentAt: toIsoAt(endDate, 21, 15),
    lastReminderSentAt: toIsoAt(endDate, 19, 30),
    snoozedUntil: null,
  };
}

function createHabitName(
  category: HabitCategory,
  frequency: HabitFrequency,
  index: number
): string {
  const parts = CATEGORY_NAME_PARTS[category];
  const part = parts[index % parts.length];
  let suffix = "Routine";

  if (frequency === "weekly") {
    suffix = "Weekly";
  } else if (frequency === "monthly") {
    suffix = "Monthly";
  }

  return `${part} ${suffix} ${Math.floor(index / parts.length) + 1}`;
}

function createHabits(
  config: PresetConfig,
  startDate: string,
  endDate: string,
  rng: () => number
): GeneratedHabit[] {
  const weeklyCount = Math.max(6, Math.round(config.habitCount * 0.22));
  const monthlyCount = Math.max(4, Math.round(config.habitCount * 0.11));
  const dailyCount = config.habitCount - weeklyCount - monthlyCount;
  const frequencies: HabitFrequency[] = [
    ...Array.from({ length: dailyCount }, () => "daily" as const),
    ...Array.from({ length: weeklyCount }, () => "weekly" as const),
    ...Array.from({ length: monthlyCount }, () => "monthly" as const),
  ];
  const archivedStart = config.habitCount - config.archivedHabitCount;
  const categories: HabitCategory[] = ["productivity", "fitness", "nutrition"];
  const habits: GeneratedHabit[] = [];

  for (const [index, frequency] of frequencies.entries()) {
    const category = categories[index % categories.length] ?? "productivity";
    let createdDate =
      frequency === "daily" && index < 4
        ? startDate
        : addDays(startDate, randomInt(rng, 0, 45));

    if (frequency === "weekly") {
      createdDate = startOfWeek(createdDate);
    } else if (frequency === "monthly") {
      createdDate = startOfMonth(createdDate);
    }

    const isArchived = index >= archivedStart;
    const endOffset = isArchived
      ? randomInt(
          rng,
          45,
          Math.max(60, Math.floor(config.trackedDayCount * 0.35))
        )
      : 0;
    const habitEndDate = isArchived ? addDays(endDate, -endOffset) : endDate;
    const selectedWeekdays =
      frequency === "daily" && rng() < 0.35
        ? [...(WEEKDAY_PATTERNS[index % WEEKDAY_PATTERNS.length] ?? [])]
        : null;
    const createdAt = toIsoAt(createdDate, 7 + (index % 4), 5);
    let resolvedEndDate = habitEndDate;

    if (createdDate > habitEndDate) {
      resolvedEndDate = createdDate;
    } else if (frequency === "weekly") {
      resolvedEndDate = startOfWeek(habitEndDate);
    } else if (frequency === "monthly") {
      resolvedEndDate = startOfMonth(habitEndDate);
    }

    habits.push({
      baseCompletionRate:
        frequency === "daily" ? 0.72 + rng() * 0.22 : 0.55 + rng() * 0.35,
      category,
      createdAt,
      createdDate,
      endDate: resolvedEndDate,
      frequency,
      id: index + 1,
      isArchived,
      name: createHabitName(category, frequency, index),
      selectedWeekdays,
      sortOrder: index,
    });
  }

  return habits;
}

function createStatusRows(
  habits: readonly GeneratedHabit[],
  trackedDates: readonly string[],
  rng: () => number
): {
  dailyStatusesByDate: Map<string, Map<number, boolean>>;
  statusRows: StatusRow[];
} {
  const statusRows: StatusRow[] = [];
  const dailyStatusesByDate = new Map<string, Map<number, boolean>>();

  for (const date of trackedDates) {
    const eligibleDailyHabits = habits.filter(
      (habit) =>
        habit.frequency === "daily" &&
        date >= habit.createdDate &&
        date <= habit.endDate &&
        isScheduledOnDate(habit, date)
    );

    if (eligibleDailyHabits.length === 0) {
      continue;
    }

    const dayMode = rng();
    const statusMap = new Map<number, boolean>();

    if (dayMode < 0.58) {
      for (const habit of eligibleDailyHabits) {
        statusMap.set(habit.id, true);
      }
    } else {
      let completedCount = 0;

      for (const habit of eligibleDailyHabits) {
        const target =
          dayMode < 0.82
            ? habit.baseCompletionRate - 0.1 + rng() * 0.08
            : habit.baseCompletionRate - 0.45 + rng() * 0.12;
        const completed = rng() < Math.max(0.05, Math.min(0.95, target));
        statusMap.set(habit.id, completed);
        completedCount += Number(completed);
      }

      if (completedCount === eligibleDailyHabits.length) {
        const index = randomInt(rng, 0, eligibleDailyHabits.length - 1);
        const habit = eligibleDailyHabits[index];
        if (habit) {
          statusMap.set(habit.id, false);
        }
      }
    }

    dailyStatusesByDate.set(date, statusMap);

    for (const habit of eligibleDailyHabits) {
      statusRows.push({
        completed: statusMap.get(habit.id) ?? false,
        frequency: habit.frequency,
        habitCategory: habit.category,
        habitCreatedAt: habit.createdAt,
        habitId: habit.id,
        habitName: habit.name,
        habitSelectedWeekdays: habit.selectedWeekdays
          ? JSON.stringify(habit.selectedWeekdays)
          : null,
        habitSortOrder: habit.sortOrder,
        periodEnd: date,
        periodStart: date,
      });
    }
  }

  for (const habit of habits.filter((item) => item.frequency !== "daily")) {
    if (habit.createdDate > habit.endDate) {
      continue;
    }

    if (habit.frequency === "weekly") {
      for (
        let cursor = startOfWeek(habit.createdDate);
        cursor <= habit.endDate;
        cursor = addDays(cursor, 7)
      ) {
        const period = getHabitPeriod("weekly", cursor);
        statusRows.push({
          completed: rng() < habit.baseCompletionRate,
          frequency: habit.frequency,
          habitCategory: habit.category,
          habitCreatedAt: habit.createdAt,
          habitId: habit.id,
          habitName: habit.name,
          habitSelectedWeekdays: null,
          habitSortOrder: habit.sortOrder,
          periodEnd: period.end,
          periodStart: period.start,
        });
      }
      continue;
    }

    for (
      let cursor = startOfMonth(habit.createdDate);
      cursor <= habit.endDate;
      cursor = addMonths(cursor, 1)
    ) {
      const period = getHabitPeriod("monthly", cursor);
      statusRows.push({
        completed: rng() < habit.baseCompletionRate - 0.05,
        frequency: habit.frequency,
        habitCategory: habit.category,
        habitCreatedAt: habit.createdAt,
        habitId: habit.id,
        habitName: habit.name,
        habitSelectedWeekdays: null,
        habitSortOrder: habit.sortOrder,
        periodEnd: period.end,
        periodStart: period.start,
      });
    }
  }

  return { dailyStatusesByDate, statusRows };
}

function createDailySummaries(
  trackedDates: readonly string[],
  dailyStatusesByDate: ReadonlyMap<string, ReadonlyMap<number, boolean>>
): { dailySummaries: DailySummary[]; streakState: StreakState } {
  const dailySummaries: DailySummary[] = [];
  let rollingState = {
    availableFreezes: 1,
    bestStreak: 0,
    currentStreak: 0,
  };

  for (const date of trackedDates) {
    const statuses = dailyStatusesByDate.get(date);
    const allCompleted =
      statuses !== undefined &&
      statuses.size > 0 &&
      [...statuses.values()].every(Boolean);
    const completedAt = allCompleted ? toIsoAt(date, 21, 45) : null;
    const settled = settleClosedDay(rollingState, allCompleted, completedAt);

    rollingState = {
      availableFreezes: settled.availableFreezes,
      bestStreak: settled.bestStreak,
      currentStreak: settled.currentStreak,
    };
    dailySummaries.push({
      allCompleted: settled.allCompleted,
      completedAt: settled.completedAt,
      date,
      freezeUsed: settled.freezeUsed,
      streakCountAfterDay: settled.currentStreak,
    });
  }

  return {
    dailySummaries,
    streakState: {
      ...rollingState,
      lastEvaluatedDate: trackedDates.at(-1) ?? null,
    },
  };
}

function createFocusSessions(
  count: number,
  trackedDates: readonly string[],
  rng: () => number
) {
  return Array.from({ length: count }, (_, index) => {
    const [firstTrackedDate] = trackedDates;

    if (!firstTrackedDate) {
      throw new Error("Expected at least one tracked date for focus fixtures.");
    }

    const date =
      trackedDates[randomInt(rng, 0, trackedDates.length - 1)] ??
      firstTrackedDate;
    const hour = randomInt(rng, 6, 21);
    const minute = randomInt(rng, 0, 3) * 15;
    const durationMinutes =
      [15, 20, 25, 30, 45, 60][randomInt(rng, 0, 5)] ?? 25;
    const startedAt = toIsoAt(date, hour, minute);
    const completedAt = new Date(
      new Date(startedAt).getTime() + durationMinutes * 60 * 1000
    ).toISOString();

    return {
      completedAt,
      completedDate: date,
      durationSeconds: durationMinutes * 60,
      entryKind: rng() < 0.78 ? "completed" : "partial",
      startedAt,
      timerSessionId: `fixture-${date}-${index + 1}`,
    } as const;
  }).toSorted((left, right) =>
    right.completedAt.localeCompare(left.completedAt)
  );
}

function getTrackedDates(startDate: string, dayCount: number): string[] {
  return Array.from({ length: dayCount }, (_, index) =>
    addDays(startDate, index)
  );
}

function validateOptions(
  options: GenerateTestDataOptions
): Required<
  Pick<
    GenerateTestDataOptions,
    "outputPath" | "preset" | "seed" | "timezone" | "today"
  >
> &
  Pick<GenerateTestDataOptions, "overwrite"> {
  const preset = options.preset ?? "medium";

  if (!(preset in PRESET_CONFIGS)) {
    throw new Error(
      `Unknown preset "${options.preset}". Use "medium" or "stress".`
    );
  }

  const seed = options.seed ?? DEFAULT_SEED;
  if (!Number.isInteger(seed)) {
    throw new TypeError("The seed must be an integer.");
  }

  const timezone = options.timezone ?? DEFAULT_TIMEZONE;
  const today = options.today ?? toDateKey(new Date());

  return {
    outputPath: path.resolve(options.outputPath ?? DEFAULT_OUTPUTS[preset]),
    overwrite: options.overwrite ?? false,
    preset,
    seed,
    timezone,
    today,
  };
}

export function generateTestData(
  options: GenerateTestDataOptions = {}
): GeneratedDatasetStats {
  const normalized = validateOptions(options);
  const config = PRESET_CONFIGS[normalized.preset];
  const rng = createRng(normalized.seed);

  if (fs.existsSync(normalized.outputPath) && !normalized.overwrite) {
    throw new Error(
      `Refusing to overwrite ${normalized.outputPath}. Pass --overwrite to replace it.`
    );
  }

  fs.mkdirSync(path.dirname(normalized.outputPath), { recursive: true });
  fs.rmSync(normalized.outputPath, { force: true });

  const endDate = addDays(normalized.today, -1);
  const startDate = addDays(endDate, -(config.trackedDayCount - 1));
  const trackedDates = getTrackedDates(startDate, config.trackedDayCount);
  const habits = createHabits(config, startDate, endDate, rng);
  const { dailyStatusesByDate, statusRows } = createStatusRows(
    habits,
    trackedDates,
    rng
  );
  const { dailySummaries, streakState } = createDailySummaries(
    trackedDates,
    dailyStatusesByDate
  );
  const focusSessions = createFocusSessions(
    config.focusSessionCount,
    trackedDates,
    rng
  );
  const client = new SqliteDatabaseClient({
    databasePath: normalized.outputPath,
  });

  runMigrations(client);
  const db = client.getDrizzle();

  db.insert(schema.streakState)
    .values({
      availableFreezes: streakState.availableFreezes,
      bestStreak: streakState.bestStreak,
      currentStreak: streakState.currentStreak,
      id: 1,
      lastEvaluatedDate: streakState.lastEvaluatedDate,
    })
    .run();

  const reminderState = buildReminderRuntimeState(endDate);
  db.insert(schema.reminderRuntimeState)
    .values({
      id: 1,
      lastMidnightWarningSentAt: reminderState.lastMidnightWarningSentAt,
      lastMissedReminderSentAt: reminderState.lastMissedReminderSentAt,
      lastReminderSentAt: reminderState.lastReminderSentAt,
      snoozedUntil: reminderState.snoozedUntil,
    })
    .run();

  const settings = buildSettings(normalized.timezone, normalized.preset);
  db.insert(schema.settings)
    .values({
      categoryPreferences: JSON.stringify(settings.categoryPreferences),
      focusCyclesBeforeLongBreak: settings.focusCyclesBeforeLongBreak,
      focusDefaultDurationSeconds: settings.focusDefaultDurationSeconds,
      focusLongBreakSeconds: settings.focusLongBreakSeconds,
      focusShortBreakSeconds: settings.focusShortBreakSeconds,
      id: 1,
      launchAtLogin: settings.launchAtLogin,
      minimizeToTray: settings.minimizeToTray,
      reminderEnabled: settings.reminderEnabled,
      reminderSnoozeMinutes: settings.reminderSnoozeMinutes,
      reminderTime: settings.reminderTime,
      resetFocusTimerShortcut: settings.resetFocusTimerShortcut,
      themeMode: settings.themeMode,
      timezone: settings.timezone,
      toggleFocusTimerShortcut: settings.toggleFocusTimerShortcut,
    })
    .run();

  chunkValues(
    habits.map((habit) => ({
      category: habit.category,
      createdAt: habit.createdAt,
      frequency: habit.frequency,
      id: habit.id,
      isArchived: habit.isArchived,
      name: habit.name,
      selectedWeekdays: habit.selectedWeekdays
        ? JSON.stringify(habit.selectedWeekdays)
        : null,
      sortOrder: habit.sortOrder,
    })),
    100,
    (chunk) => {
      db.insert(schema.habits).values(chunk).run();
    }
  );

  chunkValues(statusRows, 400, (chunk) => {
    db.insert(schema.habitPeriodStatus).values(chunk).run();
  });

  chunkValues(dailySummaries, 400, (chunk) => {
    db.insert(schema.dailySummary).values(chunk).run();
  });

  chunkValues(focusSessions, 400, (chunk) => {
    db.insert(schema.focusSessions).values(chunk).run();
  });

  client.close();

  return {
    dailySummaryCount: dailySummaries.length,
    databasePath: normalized.outputPath,
    focusSessionCount: focusSessions.length,
    habitCount: habits.length,
    habitPeriodStatusCount: statusRows.length,
    preset: normalized.preset,
    seed: normalized.seed,
    timezone: normalized.timezone,
    trackedDayCount: trackedDates.length,
  };
}
