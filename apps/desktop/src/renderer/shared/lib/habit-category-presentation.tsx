import { createContext, useContext } from "react";
import type { ReactNode } from "react";

import type { HabitCategory } from "@/shared/domain/habit";
import type {
  HabitCategoryPreferences,
  AppSettings,
} from "@/shared/domain/settings";
import { createDefaultHabitCategoryPreferences } from "@/shared/domain/settings";

const DEFAULT_CATEGORY_PREFERENCES = createDefaultHabitCategoryPreferences();

const HabitCategoryPreferencesContext = createContext<HabitCategoryPreferences>(
  DEFAULT_CATEGORY_PREFERENCES
);

export function HabitCategoryPreferencesProvider({
  children,
  preferences,
}: {
  children: ReactNode;
  preferences: HabitCategoryPreferences;
}) {
  return (
    <HabitCategoryPreferencesContext.Provider value={preferences}>
      {children}
    </HabitCategoryPreferencesContext.Provider>
  );
}

export function useHabitCategoryPreferences(): HabitCategoryPreferences {
  return useContext(HabitCategoryPreferencesContext);
}

export function getCategoryPreferencesFromSettings(
  settings: Pick<AppSettings, "categoryPreferences">
): HabitCategoryPreferences {
  return settings.categoryPreferences;
}

function getTextColorOnColor(backgroundColor: string): string {
  const hex = backgroundColor.replace("#", "");
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;

  return luminance >= 160 ? "#102000" : "#FFFFFF";
}

export function getHabitCategoryLabel(
  category: HabitCategory,
  preferences = DEFAULT_CATEGORY_PREFERENCES
): string {
  return preferences[category].label;
}

export function getHabitCategoryColor(
  category: HabitCategory,
  preferences = DEFAULT_CATEGORY_PREFERENCES
): string {
  return preferences[category].color;
}

export function getHabitCategoryUi(
  category: HabitCategory,
  preferences = DEFAULT_CATEGORY_PREFERENCES
) {
  const color = getHabitCategoryColor(category, preferences);
  const selectedTextColor = getTextColorOnColor(color);

  return {
    badgeStyle: {
      backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
      borderColor: `color-mix(in srgb, ${color} 28%, transparent)`,
      color,
    },
    color,
    label: getHabitCategoryLabel(category, preferences),
    panelStyle: {
      backgroundColor: `color-mix(in srgb, ${color} 6%, transparent)`,
      borderColor: `color-mix(in srgb, ${color} 20%, transparent)`,
    },
    progressStyle: {
      backgroundColor: color,
    },
    ringTrackColor: `color-mix(in srgb, ${color} 15%, transparent)`,
    selectedTextColor,
    textStyle: {
      color,
    },
  };
}

export function getDefaultHabitCategoryPreferences() {
  return DEFAULT_CATEGORY_PREFERENCES;
}
