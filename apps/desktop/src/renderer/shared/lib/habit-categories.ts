import {
  Apple,
  Book,
  Brain,
  Briefcase,
  Camera,
  Code,
  Coffee,
  Droplet,
  Dumbbell,
  Flame,
  Gamepad,
  Heart,
  HeartPulse,
  Leaf,
  Moon,
  Music,
  Palette,
  PenTool,
  Sun,
  Utensils,
  Wallet,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { HABIT_CATEGORY_ICON_VALUES } from "@/shared/domain/settings";
import type { HabitCategoryIcon } from "@/shared/domain/settings";

export const HABIT_CATEGORY_ICONS: Record<HabitCategoryIcon, LucideIcon> = {
  apple: Apple,
  book: Book,
  brain: Brain,
  briefcase: Briefcase,
  camera: Camera,
  code: Code,
  coffee: Coffee,
  droplet: Droplet,
  dumbbell: Dumbbell,
  flame: Flame,
  gamepad: Gamepad,
  heart: Heart,
  heartPulse: HeartPulse,
  leaf: Leaf,
  moon: Moon,
  music: Music,
  palette: Palette,
  penTool: PenTool,
  sun: Sun,
  utensils: Utensils,
  wallet: Wallet,
  zap: Zap,
};

export const HABIT_CATEGORY_ICON_OPTIONS = HABIT_CATEGORY_ICON_VALUES.map(
  (value) => ({
    icon: HABIT_CATEGORY_ICONS[value],
    label:
      value === "heartPulse"
        ? "Heart Pulse"
        : `${value.charAt(0).toUpperCase()}${value.slice(1)}`,
    value,
  })
);
