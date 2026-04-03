import { getHabitPeriod } from "@/shared/domain/habit-period";

export const GOAL_FREQUENCY_DEFINITIONS = [
  {
    label: "Weekly",
    value: "weekly",
  },
  {
    label: "Monthly",
    value: "monthly",
  },
] as const;

export type GoalFrequency =
  (typeof GOAL_FREQUENCY_DEFINITIONS)[number]["value"];

export interface FocusQuotaGoal {
  archivedAt: string | null;
  createdAt: string;
  frequency: GoalFrequency;
  id: number;
  isArchived: boolean;
  targetMinutes: number;
}

export interface FocusQuotaGoalWithStatus extends FocusQuotaGoal {
  completed: boolean;
  completedMinutes: number;
  kind: "focus-quota";
  periodEnd: string;
  periodStart: string;
}

function isGoalFrequency(value: string): value is GoalFrequency {
  return GOAL_FREQUENCY_DEFINITIONS.some(
    (definition) => definition.value === value
  );
}

export function normalizeGoalFrequency(value: string): GoalFrequency {
  return isGoalFrequency(value) ? value : "weekly";
}

export function getFocusQuotaTargetMinutesBounds(frequency: GoalFrequency): {
  max: number;
  min: number;
} {
  return {
    max: frequency === "weekly" ? 10_080 : 44_640,
    min: 30,
  };
}

export function normalizeFocusQuotaTargetMinutes(
  frequency: GoalFrequency,
  targetMinutes: number | null | undefined
): number {
  const fallback = frequency === "weekly" ? 300 : 600;
  const { max, min } = getFocusQuotaTargetMinutesBounds(frequency);
  const numericTargetMinutes =
    typeof targetMinutes === "number" && Number.isFinite(targetMinutes)
      ? targetMinutes
      : fallback;

  return Math.min(Math.max(Math.round(numericTargetMinutes), min), max);
}

export function isValidFocusQuotaTargetMinutes(
  frequency: GoalFrequency,
  targetMinutes: number
): boolean {
  if (!Number.isInteger(targetMinutes)) {
    return false;
  }

  const { max, min } = getFocusQuotaTargetMinutesBounds(frequency);
  return targetMinutes >= min && targetMinutes <= max;
}

export function getFocusQuotaGoalPeriod(
  frequency: GoalFrequency,
  dateKey: string
) {
  return getHabitPeriod(frequency, dateKey);
}

export function isFocusQuotaGoalComplete(
  goal: Pick<FocusQuotaGoal, "targetMinutes">,
  completedMinutes: number
): boolean {
  return completedMinutes >= goal.targetMinutes;
}
