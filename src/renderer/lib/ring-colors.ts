/**
 * Canonical Apple-ring color palette used across the app.
 * Single source of truth so components don't hard-code hex values.
 *
 * Colours mirror the original Apple Watch Activity rings:
 *   fitness     → Move    #FF2D55  (red/pink)
 *   nutrition   → Exercise #A3F900 (lime green)
 *   productivity → Stand  #04C7DD  (cyan)
 */
export const RING_COLORS = {
  fitness: {
    base: "#FF2D55",
    glow: "#FF6B8B",
  },
  nutrition: {
    base: "#A3F900",
    glow: "#C5FF4D",
  },
  productivity: {
    base: "#04C7DD",
    glow: "#4DDFED",
  },
} as const;

export type RingCategory = keyof typeof RING_COLORS;
