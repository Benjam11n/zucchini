import { systemClock } from "@/main/app/clock";
import { createAppTray } from "@/main/app/tray";
import { createFocusTimerCoordinator } from "@/main/features/focus/timer-coordinator";
import type { HabitsApplicationService } from "@/main/features/habits/habits-application-service";
import { HabitsApplicationService as HabitsApplicationServiceImpl } from "@/main/features/habits/habits-application-service";
import { createReminderScheduler } from "@/main/features/reminders/reminder-scheduler";
import { SqliteAppRepository } from "@/main/infra/persistence/sqlite-app-repository";
import type { AppSettings, ThemeMode } from "@/shared/domain/settings";

import { buildLoginItemSettings } from "./lifecycle";

export interface AppRuntime {
  focusTimerCoordinator: ReturnType<typeof createFocusTimerCoordinator>;
  reminders: ReturnType<typeof createReminderScheduler>;
  repository: SqliteAppRepository;
  service: HabitsApplicationService;
  tray: ReturnType<typeof createAppTray>;
}

interface CreateAppRuntimeOptions {
  onOpenFocusWidget: () => void;
  onOpenMainWindow: () => void;
  onQuit: () => void;
}

export function createAppRuntime({
  onOpenFocusWidget,
  onOpenMainWindow,
  onQuit,
}: CreateAppRuntimeOptions): AppRuntime {
  const focusTimerCoordinator = createFocusTimerCoordinator();
  const repository = new SqliteAppRepository();
  const service = new HabitsApplicationServiceImpl(repository, systemClock);
  const reminders = createReminderScheduler({
    clock: systemClock,
    getTodayState: () => service.getTodayState(),
    loadState: () => service.getReminderRuntimeState(),
    saveState: (state) => {
      service.saveReminderRuntimeState(state);
    },
  });
  const tray = createAppTray({
    onOpen: onOpenMainWindow,
    onOpenWidget: onOpenFocusWidget,
    onQuit,
    onSnooze: (settings) => reminders.snooze(settings),
  });

  return {
    focusTimerCoordinator,
    reminders,
    repository,
    service,
    tray,
  };
}

export function applyRuntimeSettings({
  applyThemeMode,
  appLike,
  runtime,
  settings,
}: {
  applyThemeMode: (themeMode: ThemeMode) => void;
  appLike: {
    setLoginItemSettings: (
      settings: ReturnType<typeof buildLoginItemSettings>
    ) => void;
  };
  runtime: Pick<AppRuntime, "reminders" | "tray">;
  settings: AppSettings;
}): boolean {
  appLike.setLoginItemSettings(buildLoginItemSettings(settings));
  runtime.reminders.schedule(settings);
  applyThemeMode(settings.themeMode);
  runtime.tray.applySettings(settings);
  return settings.minimizeToTray;
}
