/**
 * Public persistence exports for the Electron main process.
 *
 * This file exposes the SQLite-backed repository behind a simple top-level
 * import so bootstrap code does not need to know the persistence folder
 * structure.
 */
export type {
  HabitRepository,
  SettledHistoryOptions,
} from "./infra/persistence";
export { SqliteHabitRepository } from "./infra/persistence";
