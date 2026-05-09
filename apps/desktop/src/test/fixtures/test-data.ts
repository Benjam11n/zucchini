import fs from "node:fs";
import path from "node:path";

import { runMigrations } from "@/main/infra/db/migrations";
import { schema } from "@/main/infra/db/schema";
import { SqliteDatabaseClient } from "@/main/infra/db/sqlite-client";
import type { GoalFrequency, FocusQuotaGoal } from "@/shared/domain/goal";
import {
  normalizeFocusQuotaTargetMinutes,
  normalizeGoalFrequency,
} from "@/shared/domain/goal";
import type {
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";
import { normalizeHabitTargetCount } from "@/shared/domain/habit";
import { getHabitPeriod } from "@/shared/domain/habit-period";
import type { ReminderRuntimeState } from "@/shared/domain/reminder-runtime-state";
import { createDefaultAppSettings } from "@/shared/domain/settings";
import type { AppSettings } from "@/shared/domain/settings";
import type { DailySummary, StreakState } from "@/shared/domain/streak";
import { settleClosedDay } from "@/shared/domain/streak-engine";
import {
  addDays,
  addMonths,
  parseDateKey,
  startOfMonth,
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
  focusQuotaGoalCount: number;
  focusSessionCount: number;
  habitCount: number;
  habitPeriodStatusCount: number;
  preset: TestDataPreset;
  seed: number;
  timezone: string;
  trackedDayCount: number;
  windDownActionCount: number;
  windDownActionStatusCount: number;
}

interface PresetConfig {
  archivedHabitCount: number;
  focusSessionCount: number;
  goalRevisionCount: number;
  habitCount: number;
  trackedDayCount: number;
  windDownActionCount: number;
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
  targetCount: number;
}

interface GeneratedHabitTiming {
  createdAt: string;
  createdDate: string;
  endDate: string;
  isArchived: boolean;
}

interface FocusQuotaGoalRevision {
  archivedAt: string | null;
  createdAt: string;
  isArchived: boolean;
}

interface StatusRow {
  completed: boolean;
  completedCount: number;
  frequency: HabitFrequency;
  habitCategory: HabitCategory;
  habitCreatedAt: string;
  habitId: number;
  habitName: string;
  habitSelectedWeekdays: string | null;
  habitSortOrder: number;
  habitTargetCount: number;
  periodEnd: string;
  periodStart: string;
}

interface GeneratedWindDownAction {
  createdAt: string;
  id: number;
  name: string;
  sortOrder: number;
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
    goalRevisionCount: 2,
    habitCount: 36,
    trackedDayCount: 730,
    windDownActionCount: 4,
  },
  stress: {
    archivedHabitCount: 12,
    focusSessionCount: 20_000,
    goalRevisionCount: 4,
    habitCount: 120,
    trackedDayCount: 1825,
    windDownActionCount: 8,
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
const WIND_DOWN_ACTION_NAMES = [
  "Clear desk",
  "Prep tomorrow",
  "Charge devices",
  "Stretch",
  "Brush teeth",
  "Set water",
  "Read fiction",
  "Lights dimmed",
] as const;
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
  index: number,
  preset: TestDataPreset
): string {
  const parts = CATEGORY_NAME_PARTS[category];
  const part = parts[index % parts.length];
  let suffix = "Routine";

  if (frequency === "weekly") {
    suffix = "Weekly";
  } else if (frequency === "monthly") {
    suffix = "Monthly";
  }

  const baseName = `${part} ${suffix} ${Math.floor(index / parts.length) + 1}`;

  if (preset === "stress") {
    const longDescriptors = [
      "before checking messages or opening any communication apps",
      "with full notes, cleanup, and next-step planning afterwards",
      "even on busy travel days and low-energy afternoons",
      "with deliberate pacing and zero multitasking during the session",
      "while keeping the setup area clean and ready for tomorrow",
      "including prep, execution, reflection, and quick reset steps",
    ] as const;
    const descriptor = longDescriptors[index % longDescriptors.length];

    return `${baseName} ${descriptor}`;
  }

  if (index % 9 === 0) {
    return `${baseName} with a quick end-of-day reset`;
  }

  return baseName;
}

function createTargetCount(
  frequency: HabitFrequency,
  preset: TestDataPreset,
  rng: () => number
): number {
  if (frequency === "daily") {
    return 1;
  }

  if (frequency === "weekly") {
    const upperBound = preset === "stress" ? 6 : 4;
    return normalizeHabitTargetCount(
      frequency,
      randomInt(rng, 1, upperBound) + (rng() < 0.3 ? 1 : 0)
    );
  }

  const upperBound = preset === "stress" ? 18 : 10;
  return normalizeHabitTargetCount(
    frequency,
    randomInt(rng, 1, upperBound) + (rng() < 0.35 ? 2 : 0)
  );
}

function createHabitFrequencies(config: PresetConfig): HabitFrequency[] {
  const weeklyCount = Math.max(6, Math.round(config.habitCount * 0.22));
  const monthlyCount = Math.max(4, Math.round(config.habitCount * 0.11));
  const dailyCount = config.habitCount - weeklyCount - monthlyCount;

  return [
    ...Array.from({ length: dailyCount }, () => "daily" as const),
    ...Array.from({ length: weeklyCount }, () => "weekly" as const),
    ...Array.from({ length: monthlyCount }, () => "monthly" as const),
  ];
}

function alignDateToFrequency(date: string, frequency: HabitFrequency): string {
  if (frequency === "weekly") {
    return startOfWeek(date);
  }

  if (frequency === "monthly") {
    return startOfMonth(date);
  }

  return date;
}

function createHabitTiming({
  config,
  endDate,
  frequency,
  index,
  rng,
  startDate,
}: {
  config: PresetConfig;
  endDate: string;
  frequency: HabitFrequency;
  index: number;
  rng: () => number;
  startDate: string;
}): GeneratedHabitTiming {
  const initialCreatedDate =
    frequency === "daily" && index < 4
      ? startDate
      : addDays(startDate, randomInt(rng, 0, 45));
  const createdDate = alignDateToFrequency(initialCreatedDate, frequency);
  const archivedStart = config.habitCount - config.archivedHabitCount;
  const isArchived = index >= archivedStart;
  const endOffset = isArchived
    ? randomInt(
        rng,
        45,
        Math.max(60, Math.floor(config.trackedDayCount * 0.35))
      )
    : 0;
  const rawEndDate = isArchived ? addDays(endDate, -endOffset) : endDate;
  const alignedEndDate =
    createdDate > rawEndDate
      ? createdDate
      : alignDateToFrequency(rawEndDate, frequency);

  return {
    createdAt: toIsoAt(createdDate, 7 + (index % 4), 5),
    createdDate,
    endDate: alignedEndDate,
    isArchived,
  };
}

function createBaseCompletionRate(
  frequency: HabitFrequency,
  rng: () => number
): number {
  if (frequency === "daily") {
    return 0.72 + rng() * 0.22;
  }

  if (frequency === "weekly") {
    return 0.48 + rng() * 0.3;
  }

  return 0.42 + rng() * 0.28;
}

function createSelectedWeekdays(
  frequency: HabitFrequency,
  index: number,
  rng: () => number
): HabitWeekday[] | null {
  if (frequency !== "daily" || rng() >= 0.35) {
    return null;
  }

  return [...(WEEKDAY_PATTERNS[index % WEEKDAY_PATTERNS.length] ?? [])];
}

function createHabits(
  config: PresetConfig,
  startDate: string,
  endDate: string,
  preset: TestDataPreset,
  rng: () => number
): GeneratedHabit[] {
  const frequencies = createHabitFrequencies(config);
  const categories: HabitCategory[] = ["productivity", "fitness", "nutrition"];
  const habits: GeneratedHabit[] = [];

  for (const [index, frequency] of frequencies.entries()) {
    const category = categories[index % categories.length] ?? "productivity";
    const timing = createHabitTiming({
      config,
      endDate,
      frequency,
      index,
      rng,
      startDate,
    });
    const targetCount = createTargetCount(frequency, preset, rng);

    habits.push({
      baseCompletionRate: createBaseCompletionRate(frequency, rng),
      category,
      createdAt: timing.createdAt,
      createdDate: timing.createdDate,
      endDate: timing.endDate,
      frequency,
      id: index + 1,
      isArchived: timing.isArchived,
      name: createHabitName(category, frequency, index, preset),
      selectedWeekdays: createSelectedWeekdays(frequency, index, rng),
      sortOrder: index,
      targetCount,
    });
  }

  return habits;
}

function createPeriodicCompletedCount(
  habit: GeneratedHabit,
  rng: () => number
): number {
  const target = habit.targetCount;
  const strongPeriod = rng() < habit.baseCompletionRate;

  if (strongPeriod) {
    const minCompleted = Math.max(1, target - randomInt(rng, 0, 1));
    return Math.min(target, minCompleted);
  }

  const softUpperBound = Math.max(0, target - 1);
  if (softUpperBound === 0) {
    return 0;
  }

  const taper = rng() < 0.5 ? 0.4 : 0.75;
  return Math.min(
    softUpperBound,
    Math.floor(target * taper * rng()) + (rng() < 0.25 ? 1 : 0)
  );
}

function createStatusRow({
  completedCount,
  habit,
  periodEnd,
  periodStart,
}: {
  completedCount: number;
  habit: GeneratedHabit;
  periodEnd: string;
  periodStart: string;
}): StatusRow {
  return {
    completed: completedCount >= habit.targetCount,
    completedCount,
    frequency: habit.frequency,
    habitCategory: habit.category,
    habitCreatedAt: habit.createdAt,
    habitId: habit.id,
    habitName: habit.name,
    habitSelectedWeekdays: habit.selectedWeekdays
      ? JSON.stringify(habit.selectedWeekdays)
      : null,
    habitSortOrder: habit.sortOrder,
    habitTargetCount: habit.targetCount,
    periodEnd,
    periodStart,
  };
}

function getEligibleDailyHabits(
  habits: readonly GeneratedHabit[],
  date: string
): GeneratedHabit[] {
  return habits.filter(
    (habit) =>
      habit.frequency === "daily" &&
      date >= habit.createdDate &&
      date <= habit.endDate &&
      isScheduledOnDate(habit, date)
  );
}

function createDailyStatusMap(
  eligibleDailyHabits: readonly GeneratedHabit[],
  rng: () => number
): Map<number, boolean> {
  const dayMode = rng();
  const statusMap = new Map<number, boolean>();

  if (dayMode < 0.58) {
    for (const habit of eligibleDailyHabits) {
      statusMap.set(habit.id, true);
    }

    return statusMap;
  }

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

  return statusMap;
}

function createDailyStatusRows(
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
    const eligibleDailyHabits = getEligibleDailyHabits(habits, date);

    if (eligibleDailyHabits.length === 0) {
      continue;
    }

    const statusMap = createDailyStatusMap(eligibleDailyHabits, rng);
    dailyStatusesByDate.set(date, statusMap);

    for (const habit of eligibleDailyHabits) {
      const completed = statusMap.get(habit.id) ?? false;

      statusRows.push(
        createStatusRow({
          completedCount: completed ? 1 : 0,
          habit,
          periodEnd: date,
          periodStart: date,
        })
      );
    }
  }

  return { dailyStatusesByDate, statusRows };
}

function createPeriodicStatusRows(
  habits: readonly GeneratedHabit[],
  rng: () => number
): StatusRow[] {
  const statusRows: StatusRow[] = [];

  for (const habit of habits) {
    if (habit.frequency === "daily" || habit.createdDate > habit.endDate) {
      continue;
    }

    const startDate =
      habit.frequency === "weekly"
        ? startOfWeek(habit.createdDate)
        : startOfMonth(habit.createdDate);
    const addPeriod = habit.frequency === "weekly" ? addDays : addMonths;
    const increment = habit.frequency === "weekly" ? 7 : 1;

    for (
      let cursor = startDate;
      cursor <= habit.endDate;
      cursor = addPeriod(cursor, increment)
    ) {
      const period = getHabitPeriod(habit.frequency, cursor);
      const completedCount = createPeriodicCompletedCount(habit, rng);

      statusRows.push(
        createStatusRow({
          completedCount,
          habit,
          periodEnd: period.end,
          periodStart: period.start,
        })
      );
    }
  }

  return statusRows;
}

function createStatusRows(
  habits: readonly GeneratedHabit[],
  trackedDates: readonly string[],
  rng: () => number
): {
  dailyStatusesByDate: Map<string, Map<number, boolean>>;
  statusRows: StatusRow[];
} {
  const dailyStatusRows = createDailyStatusRows(habits, trackedDates, rng);
  const periodicStatusRows = createPeriodicStatusRows(habits, rng);

  return {
    dailyStatusesByDate: dailyStatusRows.dailyStatusesByDate,
    statusRows: [...dailyStatusRows.statusRows, ...periodicStatusRows],
  };
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
    const settled = settleClosedDay(rollingState, {
      allCompleted,
      completedAt,
      dayStatus: null,
    });

    rollingState = {
      availableFreezes: settled.availableFreezes,
      bestStreak: settled.bestStreak,
      currentStreak: settled.currentStreak,
    };
    dailySummaries.push({
      allCompleted: settled.allCompleted,
      completedAt: settled.completedAt,
      date,
      dayStatus: settled.dayStatus,
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
      [15, 20, 25, 30, 45, 60, 75][randomInt(rng, 0, 6)] ?? 25;
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

function getFocusQuotaGoalRevisionOffsets(
  trackedDates: readonly string[],
  preset: TestDataPreset
): number[] {
  const revisionCount = PRESET_CONFIGS[preset].goalRevisionCount;
  const revisionFractions =
    preset === "stress" ? [0.08, 0.34, 0.62, 0.84] : [0.18, 0.72];

  return revisionFractions
    .slice(0, revisionCount)
    .map((fraction, index) =>
      Math.min(
        trackedDates.length - 1,
        Math.max(index, Math.floor((trackedDates.length - 1) * fraction))
      )
    );
}

function createFocusQuotaGoalRevision(
  trackedDates: readonly string[],
  revisionOffsets: readonly number[],
  revisionIndex: number
): FocusQuotaGoalRevision | null {
  const offset = revisionOffsets[revisionIndex];
  const createdDate =
    offset === undefined ? undefined : (trackedDates[offset] ?? undefined);

  if (!createdDate) {
    return null;
  }

  const nextOffset = revisionOffsets[revisionIndex + 1];
  const nextCreatedDate =
    nextOffset === undefined ? null : (trackedDates[nextOffset] ?? null);

  return {
    archivedAt:
      nextCreatedDate === null ? null : toIsoAt(nextCreatedDate, 8, 45),
    createdAt: toIsoAt(createdDate, 8, 30),
    isArchived: nextCreatedDate !== null,
  };
}

function createFocusQuotaTargetMinutes(
  frequency: GoalFrequency,
  revisionIndex: number,
  rng: () => number
): number {
  const baseTargetMinutes = frequency === "weekly" ? 180 : 480;
  const stepMinutes =
    frequency === "weekly" ? randomInt(rng, 45, 120) : randomInt(rng, 120, 360);

  return normalizeFocusQuotaTargetMinutes(
    frequency,
    baseTargetMinutes + revisionIndex * stepMinutes
  );
}

function createFocusQuotaGoals(
  trackedDates: readonly string[],
  preset: TestDataPreset,
  rng: () => number
): FocusQuotaGoal[] {
  const revisionOffsets = getFocusQuotaGoalRevisionOffsets(
    trackedDates,
    preset
  );
  const frequencies: GoalFrequency[] = ["weekly", "monthly"];
  const goals: FocusQuotaGoal[] = [];
  let id = 1;

  for (const frequency of frequencies) {
    for (const revisionIndex of revisionOffsets.keys()) {
      const revision = createFocusQuotaGoalRevision(
        trackedDates,
        revisionOffsets,
        revisionIndex
      );

      if (!revision) {
        continue;
      }

      goals.push({
        archivedAt: revision.archivedAt,
        createdAt: revision.createdAt,
        frequency: normalizeGoalFrequency(frequency),
        id,
        isArchived: revision.isArchived,
        targetMinutes: createFocusQuotaTargetMinutes(
          frequency,
          revisionIndex,
          rng
        ),
      });
      id += 1;
    }
  }

  return goals;
}

function createWindDownActions(
  count: number,
  startDate: string
): GeneratedWindDownAction[] {
  return Array.from({ length: count }, (_, index) => ({
    createdAt: toIsoAt(addDays(startDate, index), 20, 0),
    id: index + 1,
    name: WIND_DOWN_ACTION_NAMES[index] ?? `Wind Down Action ${index + 1}`,
    sortOrder: index,
  }));
}

function createWindDownStatusRows(
  actions: readonly GeneratedWindDownAction[],
  trackedDates: readonly string[],
  rng: () => number
) {
  const rows: {
    actionId: number;
    completed: boolean;
    completedAt: string | null;
    date: string;
  }[] = [];

  const recentDates = trackedDates.slice(
    Math.max(0, trackedDates.length - Math.min(trackedDates.length, 180))
  );

  for (const date of recentDates) {
    const dayMode = rng();

    for (const action of actions) {
      const completed =
        dayMode < 0.2 ? false : rng() < (dayMode < 0.65 ? 0.82 : 0.55);

      rows.push({
        actionId: action.id,
        completed,
        completedAt: completed
          ? toIsoAt(date, 21 + (action.sortOrder % 2), 5 + action.sortOrder)
          : null,
        date,
      });
    }
  }

  return rows;
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
  const habits = createHabits(
    config,
    startDate,
    endDate,
    normalized.preset,
    rng
  );
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
  const focusQuotaGoals = createFocusQuotaGoals(
    trackedDates,
    normalized.preset,
    rng
  );
  const windDownActions = createWindDownActions(
    config.windDownActionCount,
    startDate
  );
  const windDownActionStatusRows = createWindDownStatusRows(
    windDownActions,
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
      windDownTime: settings.windDownTime,
    })
    .run();

  db.insert(schema.windDownRuntimeState)
    .values({
      id: 1,
      lastReminderSentAt: toIsoAt(endDate, 21, 0),
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
      targetCount: habit.targetCount,
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

  chunkValues(focusQuotaGoals, 100, (chunk) => {
    db.insert(schema.focusQuotaGoals).values(chunk).run();
  });

  chunkValues(windDownActions, 100, (chunk) => {
    db.insert(schema.windDownActions).values(chunk).run();
  });

  chunkValues(windDownActionStatusRows, 400, (chunk) => {
    db.insert(schema.windDownActionStatus).values(chunk).run();
  });

  client.close();

  return {
    dailySummaryCount: dailySummaries.length,
    databasePath: normalized.outputPath,
    focusQuotaGoalCount: focusQuotaGoals.length,
    focusSessionCount: focusSessions.length,
    habitCount: habits.length,
    habitPeriodStatusCount: statusRows.length,
    preset: normalized.preset,
    seed: normalized.seed,
    timezone: normalized.timezone,
    trackedDayCount: trackedDates.length,
    windDownActionCount: windDownActions.length,
    windDownActionStatusCount: windDownActionStatusRows.length,
  };
}
