import type { ReminderRuntimeState } from "@/shared/domain/reminder-runtime-state";
import type { AppSettings } from "@/shared/domain/settings";
import type { WindDownRuntimeState } from "@/shared/domain/wind-down-runtime-state";

import type { ApplicationServiceRuntime } from "./application-service-runtime";

export class RuntimeSettingsService {
  private readonly runtime: ApplicationServiceRuntime;

  constructor(runtime: ApplicationServiceRuntime) {
    this.runtime = runtime;
  }

  getReminderRuntimeState(): ReminderRuntimeState {
    return this.runtime.withInitialized(() =>
      this.runtime.repository.reminderRuntimeState.getState()
    );
  }

  updateSettings(settings: AppSettings): AppSettings {
    return this.runtime.withInitialized(() => {
      const savedSettings = this.runtime.repository.settings.saveSettings(
        settings,
        this.runtime.clock.timezone()
      );
      this.runtime.todayReadModel.invalidate();
      return savedSettings;
    });
  }

  saveReminderRuntimeState(state: ReminderRuntimeState): void {
    this.runtime.withInitialized(() => {
      this.runtime.repository.reminderRuntimeState.saveState(state);
    });
  }

  getWindDownRuntimeState(): WindDownRuntimeState {
    return this.runtime.withInitialized(() =>
      this.runtime.repository.windDownRuntimeState.getState()
    );
  }

  saveWindDownRuntimeState(state: WindDownRuntimeState): void {
    this.runtime.withInitialized(() => {
      this.runtime.repository.windDownRuntimeState.saveState(state);
    });
  }
}
