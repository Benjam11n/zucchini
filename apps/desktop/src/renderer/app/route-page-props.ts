import { appActions as actions } from "@/renderer/app/controller/app-actions";
import type { FocusPageActions } from "@/renderer/features/focus/focus.types";
import type { HistoryPageActions } from "@/renderer/features/history/history.types";
import type { InsightsPageActions } from "@/renderer/features/insights/insights.types";
import type { SettingsPageActions } from "@/renderer/features/settings/settings.types";
import type { TodayPageActions } from "@/renderer/features/today/today.types";
import type { WindDownPageActions } from "@/renderer/features/wind-down/wind-down.types";
import type { HabitManagementActions } from "@/renderer/shared/components/app/habit-management/habit-management.types";

function buildHabitManagementActions(): HabitManagementActions {
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

export function buildTodayPageActions(): TodayPageActions {
  return {
    habits: {
      ...buildHabitManagementActions(),
      decrementProgress: actions.handleDecrementHabitProgress,
      incrementProgress: actions.handleIncrementHabitProgress,
      toggleCarryover: actions.handleToggleHabitCarryover,
      toggleHabit: actions.handleToggleHabit,
    },
    history: {
      loadDay: actions.loadHistoryDay,
    },
  };
}

export function buildWindDownPageActions(): WindDownPageActions {
  return {
    windDown: {
      createAction: actions.handleCreateWindDownAction,
      deleteAction: actions.handleDeleteWindDownAction,
      renameAction: actions.handleRenameWindDownAction,
      toggleAction: actions.handleToggleWindDownAction,
    },
  };
}

export function buildHistoryPageActions(): HistoryPageActions {
  return {
    history: {
      loadYears: actions.loadHistoryYears,
      navigateToToday: () => actions.handleTabChange("today"),
      selectMonth: actions.selectHistoryMonth,
    },
    weeklyReview: {
      loadOverview: actions.loadWeeklyReviewOverview,
      select: actions.selectWeeklyReview,
    },
  };
}

export function buildFocusPageActions(): FocusPageActions {
  return {
    focusQuotaGoals: {
      archive: actions.handleArchiveFocusQuotaGoal,
      upsert: actions.handleUpsertFocusQuotaGoal,
    },
    focusTimer: {
      recordSession: actions.recordFocusSession,
      showWidget: actions.showFocusWidget,
    },
    sessions: {
      retryLoad: () => actions.loadFocusSessions(true),
    },
    settings: {
      change: actions.handleSettingsDraftChange,
    },
  };
}

export function buildSettingsPageActions(): SettingsPageActions {
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
    habits: buildHabitManagementActions(),
    openWindDown: actions.handleOpenWindDown,
    settings: {
      change: actions.handleSettingsDraftChange,
    },
  };
}

export function buildInsightsPageActions(): InsightsPageActions {
  return {
    insights: {
      retryLoad: () => actions.loadInsightsDashboard(true),
      selectRangeDays: actions.handleSelectInsightsRangeDays,
    },
  };
}
