import type { ReadyAppController } from "@/renderer/app/app-root";
import type { FocusPageActions } from "@/renderer/features/focus/focus.types";
import type { HistoryPageActions } from "@/renderer/features/history/history.types";
import type { InsightsPageActions } from "@/renderer/features/insights/insights.types";
import type { SettingsPageActions } from "@/renderer/features/settings/settings.types";
import type { TodayPageActions } from "@/renderer/features/today/today.types";
import type { WindDownPageActions } from "@/renderer/features/wind-down/wind-down.types";
import type { HabitManagementActions } from "@/renderer/shared/types/habit-actions";

type ControllerActions = ReadyAppController["actions"];

function buildHabitManagementActions(
  actions: ControllerActions
): HabitManagementActions {
  return {
    archiveHabit: actions.handleArchiveHabit,
    createHabit: actions.handleCreateHabit,
    pauseHabit: actions.handlePauseHabit,
    renameHabit: actions.handleRenameHabit,
    reorderHabits: actions.handleReorderHabits,
    resumeHabit: actions.handleResumeHabit,
    unarchiveHabit: actions.handleUnarchiveHabit,
    updateHabitCategory: actions.handleUpdateHabitCategory,
    updateHabitFrequency: actions.handleUpdateHabitFrequency,
    updateHabitTargetCount: actions.handleUpdateHabitTargetCount,
    updateHabitWeekdays: actions.handleUpdateHabitWeekdays,
  };
}

export function buildTodayPageActions(
  actions: ControllerActions
): TodayPageActions {
  return {
    habits: {
      ...buildHabitManagementActions(actions),
      decrementProgress: actions.handleDecrementHabitProgress,
      incrementProgress: actions.handleIncrementHabitProgress,
      toggleCarryover: actions.handleToggleHabitCarryover,
      toggleHabit: actions.handleToggleHabit,
    },
  };
}

export function buildWindDownPageActions(
  actions: ControllerActions
): WindDownPageActions {
  return {
    windDown: {
      createAction: actions.handleCreateWindDownAction,
      deleteAction: actions.handleDeleteWindDownAction,
      renameAction: actions.handleRenameWindDownAction,
      toggleAction: actions.handleToggleWindDownAction,
    },
  };
}

export function buildHistoryPageActions(
  actions: ControllerActions
): HistoryPageActions {
  return {
    history: {
      loadYears: actions.handleLoadHistoryYears,
      navigateToToday: () => actions.handleTabChange("today"),
      selectMonth: actions.handleSelectHistoryMonth,
    },
    weeklyReview: {
      loadOverview: actions.handleLoadWeeklyReviewOverview,
      select: actions.handleWeeklyReviewSelect,
    },
  };
}

export function buildFocusPageActions(
  actions: ControllerActions
): FocusPageActions {
  return {
    focusQuotaGoals: {
      archive: actions.handleArchiveFocusQuotaGoal,
      upsert: actions.handleUpsertFocusQuotaGoal,
    },
    focusTimer: {
      recordSession: actions.handleRecordFocusSession,
      showWidget: actions.handleShowFocusWidget,
    },
    sessions: {
      retryLoad: actions.handleRetryFocusLoad,
    },
    settings: {
      change: actions.handleSettingsDraftChange,
    },
  };
}

export function buildSettingsPageActions(
  actions: ControllerActions
): SettingsPageActions {
  return {
    dataManagement: {
      chooseBackupForRestore: actions.handleChooseBackupForRestore,
      clearData: actions.handleClearData,
      exportBackup: actions.handleExportBackup,
      exportCsvData: actions.handleExportCsvData,
      getLatestAutoBackupRestorePreview:
        actions.handleGetLatestAutoBackupRestorePreview,
      openAutoBackupFolder: actions.handleOpenAutoBackupFolder,
      openDataFolder: actions.handleOpenDataFolder,
      restoreBackup: actions.handleRestoreBackup,
    },
    focusQuotaGoals: {
      archive: actions.handleArchiveFocusQuotaGoal,
      unarchive: actions.handleUnarchiveFocusQuotaGoal,
      upsert: actions.handleUpsertFocusQuotaGoal,
    },
    habits: buildHabitManagementActions(actions),
    openWindDown: actions.handleOpenWindDown,
    settings: {
      change: actions.handleSettingsDraftChange,
    },
  };
}

export function buildInsightsPageActions(
  actions: ControllerActions
): InsightsPageActions {
  return {
    insights: {
      retryLoad: actions.handleRetryInsightsLoad,
      selectRangeDays: actions.handleSelectInsightsRangeDays,
    },
  };
}
