/**
 * Generic async operation phase.
 *
 * Tracks the lifecycle of a data-fetching or mutation operation.
 * Used by focus sessions, weekly review, and settings save phases.
 */
export type AsyncPhase = "error" | "idle" | "loading" | "ready";
