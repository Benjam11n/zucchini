import type { z, ZodType } from "zod";

import type { FocusSession } from "@/shared/domain/focus-session";
import type { PersistedFocusTimerState } from "@/shared/domain/focus-timer";
import { createFocusSessionInputSchema } from "@/shared/domain/schemas/focus-session";
import { persistedFocusTimerStateSchema } from "@/shared/domain/schemas/focus-timer";
import { appSettingsSchema } from "@/shared/domain/schemas/settings";
import type { AppSettings } from "@/shared/domain/settings";
import type { HabitStatusPatch } from "@/shared/read-models/habit-status-patch";
import type { TodayState } from "@/shared/read-models/today-state";

import {
  createHabitPayloadSchema,
  createWindDownActionPayloadSchema,
  focusQuotaGoalIdPayloadSchema,
  focusQuotaGoalUpsertPayloadSchema,
  habitIdPayloadSchema,
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
} from "./app-schemas";

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

export const appCommandRegistry = {
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

type AppCommandRegistry = typeof appCommandRegistry;

export type AppCommandType = Extract<keyof AppCommandRegistry, string>;

type PayloadForDefinition<TDefinition> =
  TDefinition extends PayloadCommandDefinition<infer TPayloadSchema, unknown>
    ? z.infer<TPayloadSchema>
    : never;

type CommandForType<TType extends AppCommandType> =
  AppCommandRegistry[TType] extends PayloadCommandDefinition<ZodType, unknown>
    ? {
        payload: PayloadForDefinition<AppCommandRegistry[TType]>;
        type: TType;
      }
    : { type: TType };

export type AppCommand = {
  [TType in AppCommandType]: CommandForType<TType>;
}[AppCommandType];

export type PayloadForAppCommandType<TType extends AppCommandType> =
  PayloadForDefinition<AppCommandRegistry[TType]>;

export type ResultForAppCommandType<TType extends AppCommandType> =
  AppCommandRegistry[TType] extends
    | EmptyCommandDefinition<infer TResult>
    | PayloadCommandDefinition<ZodType, infer TResult>
    ? TResult
    : never;

export type AppCommandResult = ResultForAppCommandType<AppCommandType>;

export type ResultForAppCommand<C extends AppCommand> = ResultForAppCommandType<
  C["type"]
>;

export function isAppCommandType(type: string): type is AppCommandType {
  return Object.hasOwn(appCommandRegistry, type);
}
