import type { HabitCategory } from "../../shared/domain/habit";
import { RING_COLORS } from "./ring-colors";

/**
 * Light-mode tints are intentionally muted — the ring colours (#A3F900, #04C7DD)
 * are very saturated and look harsh on white. Panel/badge tints use low-opacity
 * versions; text uses a darkened hue for readability.
 */
export const HABIT_CATEGORY_UI: Record<
  HabitCategory,
  {
    badgeClassName: string;
    panelClassName: string;
    progressClassName: string;
    ringColor: string;
    ringTrackColor: string;
    textClassName: string;
  }
> = {
  // Fitness → Move ring: #FF2D55 red/pink
  fitness: {
    badgeClassName:
      "border-[#FF2D55]/30 bg-[#FF2D55]/8 text-[#c01038] dark:border-[#FF2D55]/40 dark:bg-[#FF2D55]/12 dark:text-[#ff7a95]",
    panelClassName:
      "border-[#FF2D55]/20 bg-[#FF2D55]/5 dark:border-[#FF2D55]/30 dark:bg-[#FF2D55]/10",
    progressClassName: "bg-[#FF2D55]",
    ringColor: RING_COLORS.fitness.base,
    ringTrackColor: "rgba(255, 45, 85, 0.15)",
    textClassName: "text-[#c01038] dark:text-[#ff7a95]",
  },
  // Nutrition → Exercise ring: #A3F900 lime green
  nutrition: {
    badgeClassName:
      "border-[#6aad00]/30 bg-[#6aad00]/8 text-[#496e00] dark:border-[#A3F900]/30 dark:bg-[#A3F900]/10 dark:text-[#C5FF4D]",
    panelClassName:
      "border-[#6aad00]/20 bg-[#6aad00]/5 dark:border-[#A3F900]/20 dark:bg-[#A3F900]/8",
    progressClassName: "bg-[#A3F900]",
    ringColor: RING_COLORS.nutrition.base,
    ringTrackColor: "rgba(163, 249, 0, 0.15)",
    textClassName: "text-[#496e00] dark:text-[#C5FF4D]",
  },
  // Productivity → Stand ring: #04C7DD cyan
  productivity: {
    badgeClassName:
      "border-[#04C7DD]/30 bg-[#04C7DD]/8 text-[#04758a] dark:border-[#04C7DD]/40 dark:bg-[#04C7DD]/12 dark:text-[#4DDFED]",
    panelClassName:
      "border-[#04C7DD]/20 bg-[#04C7DD]/5 dark:border-[#04C7DD]/30 dark:bg-[#04C7DD]/10",
    progressClassName: "bg-[#04C7DD]",
    ringColor: RING_COLORS.productivity.base,
    ringTrackColor: "rgba(4, 199, 221, 0.15)",
    textClassName: "text-[#04758a] dark:text-[#4DDFED]",
  },
};
