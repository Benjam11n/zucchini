import { z } from "zod";

import { isoTimestampSchema } from "@/shared/domain/schemas/date";

const focusTimerPhaseSchema = z.enum(["focus", "break"]);
const focusTimerStatusSchema = z.enum(["idle", "running", "paused"]);
const focusBreakVariantSchema = z.enum(["short", "long"]);

const persistedCompletedBreakStateSchema = z
  .object({
    completedAt: isoTimestampSchema,
    timerSessionId: z.string().trim().min(1).max(120),
    variant: focusBreakVariantSchema,
  })
  .strict();

export const persistedFocusTimerStateSchema = z
  .object({
    breakVariant: focusBreakVariantSchema.nullable(),
    completedFocusCycles: z.number().int().min(0),
    cycleId: z.string().trim().min(1).max(120).nullable(),
    endsAt: isoTimestampSchema.nullable(),
    focusDurationMs: z.number().int().min(0),
    lastCompletedBreak: persistedCompletedBreakStateSchema.nullable(),
    lastUpdatedAt: isoTimestampSchema,
    phase: focusTimerPhaseSchema,
    remainingMs: z.number().int().min(0),
    startedAt: isoTimestampSchema.nullable(),
    status: focusTimerStatusSchema,
    timerSessionId: z.string().trim().min(1).max(120).nullable(),
  })
  .strict()
  .superRefine((state, context) => {
    if (state.phase === "break" && state.breakVariant === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Break timers must include a break variant.",
        path: ["breakVariant"],
      });
    }

    if (state.phase === "focus" && state.breakVariant !== null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Focus timers cannot include a break variant.",
        path: ["breakVariant"],
      });
    }
  });
