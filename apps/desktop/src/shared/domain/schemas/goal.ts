import { z } from "zod";

import { GOAL_FREQUENCY_DEFINITIONS } from "@/shared/domain/goal";

export const goalFrequencySchema = z.enum(
  GOAL_FREQUENCY_DEFINITIONS.map((definition) => definition.value) as [
    (typeof GOAL_FREQUENCY_DEFINITIONS)[number]["value"],
    ...(typeof GOAL_FREQUENCY_DEFINITIONS)[number]["value"][],
  ]
);

export const focusQuotaTargetMinutesSchema = z
  .number()
  .int()
  .min(30, "Focus quota target minutes must be at least 30 minutes.")
  .max(44_640, "Focus quota target minutes must be at most 44,640 minutes.");
