import type { RuntimeAppPort } from "@/main/app/ports";
import { createAppTray } from "@/main/app/tray";
import type { HabitsApplicationService } from "@/main/features/habits/habits-application-service";
import { HabitsApplicationService as HabitsApplicationServiceImpl } from "@/main/features/habits/habits-application-service";
import { createReminderCoordinator } from "@/main/features/reminders/coordinator";
import type { ReminderCoordinator } from "@/main/features/reminders/coordinator";
import { SqliteAppRepository } from "@/main/infra/persistence/sqlite-app-repository";
/**
 * App runtime factory — creates and wires the long-lived main-process objects.
 *
 * Builds the repository, application service, reminder scheduler, and system
 * tray. Also exposes {@link applyRuntimeSettings} which
 * syncs OS-level settings (login items, reminders, theme, tray) whenever the
 * user changes preferences.
 */
import { systemClock } from "@/shared/domain/clock";
import type { AppSettings, ThemeMode } from "@/shared/domain/settings";

import { buildLoginItemSettings } from "./lifecycle";

export interface AppRuntime {
  reminders: ReminderCoordinator;
  repository: SqliteAppRepository;
  service: HabitsApplicationService;
  tray: ReturnType<typeof createAppTray>;
}

interface CreateAppRuntimeOptions {
  clock?: typeof systemClock;
  onOpenFocusWidget: () => void;
  onOpenMainWindow: () => void;
  onOpenWindDown: () => void;
  onQuit: () => void;
  repository?: SqliteAppRepository;
  service?: HabitsApplicationService;
}

export function createAppRuntime({
  clock = systemClock,
  onOpenFocusWidget,
  onOpenMainWindow,
  onOpenWindDown,
  onQuit,
  repository: providedRepository,
  service: providedService,
}: CreateAppRuntimeOptions): AppRuntime {
  const repository = providedRepository ?? new SqliteAppRepository();
  const service =
    providedService ?? new HabitsApplicationServiceImpl(repository, clock);
  const reminders = createReminderCoordinator({
    clock,
    onOpenWindDown,
    repository: service,
    today: {
      getTodayState: () => service.getTodayState(),
    },
  });
  const tray = createAppTray({
    onOpen: onOpenMainWindow,
    onOpenWidget: onOpenFocusWidget,
    onQuit,
    onSnooze: (settings) => reminders.snooze(settings),
  });

  return {
    reminders,
    repository,
    service,
    tray,
  };
}

export function applyRuntimeSettings({
  applyThemeMode,
  app,
  runtime,
  settings,
}: {
  applyThemeMode: (themeMode: ThemeMode) => void;
  app: RuntimeAppPort;
  runtime: Pick<AppRuntime, "reminders" | "tray">;
  settings: AppSettings;
}): boolean {
  if (app.isPackaged) {
    app.setLoginItemSettings(buildLoginItemSettings(settings));
  }
  runtime.reminders.schedule(settings);
  applyThemeMode(settings.themeMode);
  runtime.tray.applySettings(settings);
  return settings.minimizeToTray;
}
