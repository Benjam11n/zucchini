import { z } from "zod";

import {
  dateKeySchema,
  isoTimestampSchema,
} from "@/shared/domain/schemas/date";

const focusSessionEntryKindSchema = z.enum(["completed", "partial"]);

export const createFocusSessionInputSchema = z
  .object({
    completedAt: isoTimestampSchema,
    completedDate: dateKeySchema,
    durationSeconds: z
      .number()
      .int()
      .positive()
      .max(60 * 60 * 8),
    entryKind: focusSessionEntryKindSchema,
    startedAt: isoTimestampSchema,
    timerSessionId: z.string().trim().min(1).max(120),
  })
  .strict();
