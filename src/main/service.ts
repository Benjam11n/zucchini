/**
 * Public main-process service exports.
 *
 * This file keeps callers from reaching deep into the feature folders. It
 * gives the rest of the app a stable place to import the habit service layer.
 */
export type { HabitsService } from "./features/habits/service";
export { HabitService } from "./features/habits/service";
