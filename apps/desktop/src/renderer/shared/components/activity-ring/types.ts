import type { HabitCategoryProgress } from "@/shared/domain/habit";
import type { HabitCategoryPreferences } from "@/shared/domain/settings";

export interface ActivityData {
  label: string;
  value: number;
  color: string;
  accentTextColor: string;
  /** Diameter of this ring's SVG in px */
  size: number;
  current: number;
  target: number;
  unit: string;
}

export interface HabitActivityRingProps {
  categoryProgress: HabitCategoryProgress[];
  categoryPreferences?: HabitCategoryPreferences;
  className?: string;
  showDetails?: boolean;
  size?: number;
}

export interface ActivityRingGlyphProps {
  activities: ActivityData[];
  className?: string;
  size?: number;
}

export interface CircleProgressProps {
  data: ActivityData;
  index: number;
}
