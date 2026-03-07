/**
 * Canonical Apple-ring color palette used across the app.
 * Single source of truth so components don't hard-code hex values.
 *
 * Theme-aware palette for the activity categories.
 */
export const RING_COLORS = {
  fitness: {
    base: "var(--ring-fitness)",
    glow: "var(--ring-fitness-glow)",
  },
  nutrition: {
    base: "var(--ring-nutrition)",
    glow: "var(--ring-nutrition-glow)",
  },
  productivity: {
    base: "var(--ring-productivity)",
    glow: "var(--ring-productivity-glow)",
  },
} as const;

export type RingCategory = keyof typeof RING_COLORS;
