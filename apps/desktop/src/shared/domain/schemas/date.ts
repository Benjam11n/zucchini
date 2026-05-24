import { z } from "zod";

import { isValidDateKey } from "@/shared/domain/date-key";

export const dateKeySchema = z.string().refine(isValidDateKey, {
  message: "Date keys must be real calendar dates in YYYY-MM-DD format.",
});

export const isoTimestampSchema = z.string().datetime({
  message: "Timestamps must use ISO 8601 format.",
  offset: true,
});
