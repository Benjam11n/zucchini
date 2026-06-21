import type { ReminderRuntimeState } from "@/shared/domain/reminder-runtime-state";
import type { AppSettings } from "@/shared/domain/settings";
import type { WindDownRuntimeState } from "@/shared/domain/wind-down-runtime-state";

import { ApplicationServiceSlice } from "./application-service-slice";

export class RuntimeSettingsService extends ApplicationServiceSlice {
  getReminderRuntimeState(): ReminderRuntimeState {
    return this.withInitialized(() =>
      this.repository.reminderRuntimeState.getState()
    );
  }

  updateSettings(settings: AppSettings): AppSettings {
    return this.withInitialized(() => {
      const savedSettings = this.repository.settings.saveSettings(
        settings,
        this.clock.timezone()
      );
      this.todayReadModel.invalidate();
      return savedSettings;
    });
  }

  saveReminderRuntimeState(state: ReminderRuntimeState): void {
    this.withInitialized(() => {
      this.repository.reminderRuntimeState.saveState(state);
    });
  }

  getWindDownRuntimeState(): WindDownRuntimeState {
    return this.withInitialized(() =>
      this.repository.windDownRuntimeState.getState()
    );
  }

  saveWindDownRuntimeState(state: WindDownRuntimeState): void {
    this.withInitialized(() => {
      this.repository.windDownRuntimeState.saveState(state);
    });
  }
}
