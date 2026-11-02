import { useShallow } from "zustand/react/shallow";

import { useBootStore } from "@/renderer/app/state/boot-store";
import { useUiStore } from "@/renderer/app/state/ui-store";
import { useSettingsStore } from "@/renderer/features/settings/state/settings-store";
import { useTodayStore } from "@/renderer/features/today/state/today-store";
import { useWeeklyReviewStore } from "@/renderer/features/weekly-review/state/weekly-review-store";

export function useAppControllerCoreState() {
  const bootState = useBootStore(
    useShallow((state) => ({
      bootError: state.bootError,
      bootPhase: state.bootPhase,
    }))
  );
  const settingsState = useSettingsStore(
    useShallow((state) => ({
      settingsDraft: state.settingsDraft,
      settingsSavePhase: state.settingsSavePhase,
    }))
  );
  const systemTheme = useUiStore((state) => state.systemTheme);
  const todayState = useTodayStore((state) => state.todayState);

  return {
    ...bootState,
    ...settingsState,
    systemTheme,
    todayState,
  };
}

export function useWeeklyReviewState() {
  return useWeeklyReviewStore(
    useShallow((state) => ({
      isWeeklyReviewSpotlightOpen: state.isWeeklyReviewSpotlightOpen,
      weeklyReviewOverview: state.weeklyReviewOverview,
      weeklyReviewPhase: state.weeklyReviewPhase,
    }))
  );
}
