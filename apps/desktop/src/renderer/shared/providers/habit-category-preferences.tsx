import { createContext, use } from "react";
import type { ReactNode } from "react";

import { getDefaultHabitCategoryPreferences } from "@/renderer/shared/components/app/habit-category/lib/presentation";
import type { HabitCategoryPreferences } from "@/shared/domain/settings";

const HabitCategoryPreferencesContext = createContext<HabitCategoryPreferences>(
  getDefaultHabitCategoryPreferences()
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
  return use(HabitCategoryPreferencesContext);
}
