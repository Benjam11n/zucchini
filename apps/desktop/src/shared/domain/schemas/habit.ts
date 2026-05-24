import { z } from "zod";

import {
  isValidHabitCategoryColor,
  isValidHabitCategoryIcon,
  isValidHabitCategoryLabel,
} from "@/shared/domain/settings";

export const habitIdSchema = z.number().int().positive();

export const habitNameSchema = z
  .string()
  .trim()
  .min(1, "Habit names cannot be empty.")
  .max(120, "Habit names must be 120 characters or fewer.");

export const habitCategorySchema = z.enum([
  "nutrition",
  "productivity",
  "fitness",
]);

const habitCategoryMetadataSchema = z
  .object({
    color: z.string().refine(isValidHabitCategoryColor, {
      message: "Category colors must use #RRGGBB format.",
    }),
    icon: z.string().refine(isValidHabitCategoryIcon, {
      message: "Category icons must use a supported icon id.",
    }),
    label: z.string().refine(isValidHabitCategoryLabel, {
      message: "Category labels must be between 1 and 24 characters.",
    }),
  })
  .strict();

export const habitCategoryPreferencesSchema = z
  .object({
    fitness: habitCategoryMetadataSchema,
    nutrition: habitCategoryMetadataSchema,
    productivity: habitCategoryMetadataSchema,
  })
  .strict();

export const habitFrequencySchema = z.enum(["daily", "weekly", "monthly"]);

export const habitTargetCountSchema = z.number().int().min(1).max(31);

const habitWeekdaySchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

export const habitWeekdaysSchema = z
  .array(habitWeekdaySchema)
  .max(7)
  .superRefine((weekdays, context) => {
    if (new Set(weekdays).size !== weekdays.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Habit weekdays cannot contain duplicates.",
      });
    }
  });

export const reorderHabitIdsSchema = z
  .array(habitIdSchema)
  .superRefine((habitIds, context) => {
    const uniqueHabitIds = new Set(habitIds);

    if (uniqueHabitIds.size !== habitIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Habit reorder payload cannot contain duplicate ids.",
      });
    }
  });
