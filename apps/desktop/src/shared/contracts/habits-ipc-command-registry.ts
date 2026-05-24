import type { z, ZodType } from "zod";

import type { FocusSession } from "@/shared/domain/focus-session";
import type { PersistedFocusTimerState } from "@/shared/domain/focus-timer";
import type { AppSettings } from "@/shared/domain/settings";

import type { HabitStatusPatch } from "./habit-status-patch";
import {
  appSettingsSchema,
  createFocusSessionInputSchema,
  createHabitPayloadSchema,
  createWindDownActionPayloadSchema,
  focusQuotaGoalIdPayloadSchema,
  focusQuotaGoalUpsertPayloadSchema,
  habitIdPayloadSchema,
  persistedFocusTimerStateSchema,
  renameHabitPayloadSchema,
  renameWindDownActionPayloadSchema,
  reorderHabitPayloadSchema,
  setDayStatusPayloadSchema,
  toggleCarryoverPayloadSchema,
  updateHabitCategoryPayloadSchema,
  updateHabitFrequencyPayloadSchema,
  updateHabitTargetCountPayloadSchema,
  updateHabitWeekdaysPayloadSchema,
  windDownActionIdPayloadSchema,
} from "./habits-ipc-schema";
import type { TodayState } from "./today-state";

interface PayloadCommandDefinition<TPayloadSchema extends ZodType, TResult> {
  payloadSchema: TPayloadSchema;
  result?: TResult;
}

interface EmptyCommandDefinition<TResult> {
  payloadSchema: null;
  result?: TResult;
}

type CommandDefinition =
  | PayloadCommandDefinition<ZodType, unknown>
  | EmptyCommandDefinition<unknown>;

function command<TPayloadSchema extends ZodType, TResult>(
  payloadSchema: TPayloadSchema
): PayloadCommandDefinition<TPayloadSchema, TResult> {
  return { payloadSchema };
}

function emptyCommand<TResult>(): EmptyCommandDefinition<TResult> {
  return { payloadSchema: null };
}

export const habitCommandRegistry = {
  "focusQuotaGoal.archive": command<
    typeof focusQuotaGoalIdPayloadSchema,
    TodayState
  >(focusQuotaGoalIdPayloadSchema),
  "focusQuotaGoal.unarchive": command<
    typeof focusQuotaGoalIdPayloadSchema,
    TodayState
  >(focusQuotaGoalIdPayloadSchema),
  "focusQuotaGoal.upsert": command<
    typeof focusQuotaGoalUpsertPayloadSchema,
    TodayState
  >(focusQuotaGoalUpsertPayloadSchema),
  "focusSession.record": command<
    typeof createFocusSessionInputSchema,
    FocusSession
  >(createFocusSessionInputSchema),
  "focusTimer.saveState": command<
    typeof persistedFocusTimerStateSchema,
    PersistedFocusTimerState
  >(persistedFocusTimerStateSchema),
  "habit.archive": command<typeof habitIdPayloadSchema, TodayState>(
    habitIdPayloadSchema
  ),
  "habit.create": command<typeof createHabitPayloadSchema, TodayState>(
    createHabitPayloadSchema
  ),
  "habit.decrementProgress": command<
    typeof habitIdPayloadSchema,
    HabitStatusPatch
  >(habitIdPayloadSchema),
  "habit.incrementProgress": command<
    typeof habitIdPayloadSchema,
    HabitStatusPatch
  >(habitIdPayloadSchema),
  "habit.pause": command<typeof habitIdPayloadSchema, TodayState>(
    habitIdPayloadSchema
  ),
  "habit.rename": command<typeof renameHabitPayloadSchema, TodayState>(
    renameHabitPayloadSchema
  ),
  "habit.reorder": command<typeof reorderHabitPayloadSchema, TodayState>(
    reorderHabitPayloadSchema
  ),
  "habit.resume": command<typeof habitIdPayloadSchema, TodayState>(
    habitIdPayloadSchema
  ),
  "habit.toggle": command<typeof habitIdPayloadSchema, HabitStatusPatch>(
    habitIdPayloadSchema
  ),
  "habit.unarchive": command<typeof habitIdPayloadSchema, TodayState>(
    habitIdPayloadSchema
  ),
  "habit.updateCategory": command<
    typeof updateHabitCategoryPayloadSchema,
    TodayState
  >(updateHabitCategoryPayloadSchema),
  "habit.updateFrequency": command<
    typeof updateHabitFrequencyPayloadSchema,
    TodayState
  >(updateHabitFrequencyPayloadSchema),
  "habit.updateTargetCount": command<
    typeof updateHabitTargetCountPayloadSchema,
    TodayState
  >(updateHabitTargetCountPayloadSchema),
  "habit.updateWeekdays": command<
    typeof updateHabitWeekdaysPayloadSchema,
    TodayState
  >(updateHabitWeekdaysPayloadSchema),
  "settings.update": command<typeof appSettingsSchema, AppSettings>(
    appSettingsSchema
  ),
  "today.moveUnfinishedToTomorrow": emptyCommand<TodayState>(),
  "today.setDayStatus": command<typeof setDayStatusPayloadSchema, TodayState>(
    setDayStatusPayloadSchema
  ),
  "today.toggleCarryover": command<
    typeof toggleCarryoverPayloadSchema,
    TodayState
  >(toggleCarryoverPayloadSchema),
  "today.toggleSickDay": emptyCommand<TodayState>(),
  "windDown.createAction": command<
    typeof createWindDownActionPayloadSchema,
    TodayState
  >(createWindDownActionPayloadSchema),
  "windDown.deleteAction": command<
    typeof windDownActionIdPayloadSchema,
    TodayState
  >(windDownActionIdPayloadSchema),
  "windDown.renameAction": command<
    typeof renameWindDownActionPayloadSchema,
    TodayState
  >(renameWindDownActionPayloadSchema),
  "windDown.toggleAction": command<
    typeof windDownActionIdPayloadSchema,
    TodayState
  >(windDownActionIdPayloadSchema),
} as const satisfies Record<string, CommandDefinition>;

type HabitCommandRegistry = typeof habitCommandRegistry;

export type HabitCommandType = Extract<keyof HabitCommandRegistry, string>;

type PayloadForDefinition<TDefinition> =
  TDefinition extends PayloadCommandDefinition<infer TPayloadSchema, unknown>
    ? z.infer<TPayloadSchema>
    : never;

type CommandForType<TType extends HabitCommandType> =
  HabitCommandRegistry[TType] extends PayloadCommandDefinition<ZodType, unknown>
    ? {
        payload: PayloadForDefinition<HabitCommandRegistry[TType]>;
        type: TType;
      }
    : { type: TType };

export type HabitCommand = {
  [TType in HabitCommandType]: CommandForType<TType>;
}[HabitCommandType];

export type PayloadForCommandType<TType extends HabitCommandType> =
  PayloadForDefinition<HabitCommandRegistry[TType]>;

export type ResultForCommandType<TType extends HabitCommandType> =
  HabitCommandRegistry[TType] extends
    | EmptyCommandDefinition<infer TResult>
    | PayloadCommandDefinition<ZodType, infer TResult>
    ? TResult
    : never;

export type HabitCommandResult = ResultForCommandType<HabitCommandType>;

export type ResultForCommand<C extends HabitCommand> = ResultForCommandType<
  C["type"]
>;

export function isHabitCommandType(type: string): type is HabitCommandType {
  return Object.hasOwn(habitCommandRegistry, type);
}
