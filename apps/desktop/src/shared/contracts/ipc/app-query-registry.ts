import type { z, ZodType } from "zod";

import type { FocusSession } from "@/shared/domain/focus-session";
import type { PersistedFocusTimerState } from "@/shared/domain/focus-timer";
import type { Habit } from "@/shared/domain/habit";
import type { HistoryDay, HistorySummaryDay } from "@/shared/domain/history";
import type { InsightsDashboard } from "@/shared/domain/insights";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";
import type { TodayState } from "@/shared/read-models/today-state";

import {
  focusSessionListPayloadSchema,
  historyDayPayloadSchema,
  historySummaryMonthPayloadSchema,
  historyYearPayloadSchema,
  optionalInsightsPayloadSchema,
  optionalLimitPayloadSchema,
  weeklyReviewPayloadSchema,
} from "./app-schemas";

interface PayloadQueryDefinition<TPayloadSchema extends ZodType, TResult> {
  payloadSchema: TPayloadSchema;
  result?: TResult;
}

interface EmptyQueryDefinition<TResult> {
  payloadSchema: null;
  result?: TResult;
}

type QueryDefinition =
  | PayloadQueryDefinition<ZodType, unknown>
  | EmptyQueryDefinition<unknown>;

function query<TPayloadSchema extends ZodType, TResult>(
  payloadSchema: TPayloadSchema
): PayloadQueryDefinition<TPayloadSchema, TResult> {
  return { payloadSchema };
}

function emptyQuery<TResult>(): EmptyQueryDefinition<TResult> {
  return { payloadSchema: null };
}

export const appQueryRegistry = {
  "focusSession.list": query<
    typeof focusSessionListPayloadSchema,
    FocusSession[]
  >(focusSessionListPayloadSchema),
  "focusTimer.getState": emptyQuery<PersistedFocusTimerState | null>(),
  "habit.list": emptyQuery<Habit[]>(),
  "history.get": query<typeof optionalLimitPayloadSchema, HistoryDay[]>(
    optionalLimitPayloadSchema
  ),
  "history.getDay": query<typeof historyDayPayloadSchema, HistoryDay>(
    historyDayPayloadSchema
  ),
  "history.getYear": query<typeof historyYearPayloadSchema, HistoryDay[]>(
    historyYearPayloadSchema
  ),
  "history.summary": query<
    typeof optionalLimitPayloadSchema,
    HistorySummaryDay[]
  >(optionalLimitPayloadSchema),
  "history.summaryMonth": query<
    typeof historySummaryMonthPayloadSchema,
    HistorySummaryDay[]
  >(historySummaryMonthPayloadSchema),
  "history.summaryYear": query<
    typeof historyYearPayloadSchema,
    HistorySummaryDay[]
  >(historyYearPayloadSchema),
  "history.years": emptyQuery<number[]>(),
  "insights.dashboard": query<
    typeof optionalInsightsPayloadSchema,
    InsightsDashboard
  >(optionalInsightsPayloadSchema),
  "today.get": emptyQuery<TodayState>(),
  "weeklyReview.get": query<typeof weeklyReviewPayloadSchema, WeeklyReview>(
    weeklyReviewPayloadSchema
  ),
  "weeklyReview.overview": emptyQuery<WeeklyReviewOverview>(),
} as const satisfies Record<string, QueryDefinition>;

type AppQueryRegistry = typeof appQueryRegistry;

export type AppQueryType = Extract<keyof AppQueryRegistry, string>;

type PayloadForDefinition<TDefinition> =
  TDefinition extends PayloadQueryDefinition<infer TPayloadSchema, unknown>
    ? z.infer<TPayloadSchema>
    : never;

type QueryPayload<TDefinition> = Exclude<
  PayloadForDefinition<TDefinition>,
  undefined
>;

type QueryForType<TType extends AppQueryType> =
  AppQueryRegistry[TType] extends PayloadQueryDefinition<ZodType, unknown>
    ? undefined extends PayloadForDefinition<AppQueryRegistry[TType]>
      ? {
          payload?: QueryPayload<AppQueryRegistry[TType]> | undefined;
          type: TType;
        }
      : {
          payload: PayloadForDefinition<AppQueryRegistry[TType]>;
          type: TType;
        }
    : { type: TType };

export type AppQuery = {
  [TType in AppQueryType]: QueryForType<TType>;
}[AppQueryType];

export type PayloadForAppQueryType<TType extends AppQueryType> =
  PayloadForDefinition<AppQueryRegistry[TType]>;

export type ResultForAppQueryType<TType extends AppQueryType> =
  AppQueryRegistry[TType] extends
    | EmptyQueryDefinition<infer TResult>
    | PayloadQueryDefinition<ZodType, infer TResult>
    ? TResult
    : never;

export type AppQueryResult = ResultForAppQueryType<AppQueryType>;

export type ResultForAppQuery<Q extends AppQuery> = ResultForAppQueryType<
  Q["type"]
>;

export function isAppQueryType(type: string): type is AppQueryType {
  return Object.hasOwn(appQueryRegistry, type);
}
