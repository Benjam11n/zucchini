import type { ReminderRuntimeState } from "@/shared/domain/reminder-runtime-state";
import type { AppSettings } from "@/shared/domain/settings";
import type { WindDownRuntimeState } from "@/shared/domain/wind-down-runtime-state";

import { ApplicationServiceSlice } from "./application-service-slice";

export class RuntimeSettingsService extends ApplicationServiceSlice {
  getReminderRuntimeState(): ReminderRuntimeState {
    return this.withInitialized(() =>
      this.repository.getReminderRuntimeState()
    );
  }

  updateSettings(settings: AppSettings): AppSettings {
    return this.withInitialized(() => {
      const savedSettings = this.repository.saveSettings(
        settings,
        this.clock.timezone()
      );
      this.todayReadModel.invalidate();
      return savedSettings;
    });
  }

  saveReminderRuntimeState(state: ReminderRuntimeState): void {
    this.withInitialized(() => {
      this.repository.saveReminderRuntimeState(state);
    });
  }

  getWindDownRuntimeState(): WindDownRuntimeState {
    return this.withInitialized(() =>
      this.repository.getWindDownRuntimeState()
    );
  }

  saveWindDownRuntimeState(state: WindDownRuntimeState): void {
    this.withInitialized(() => {
      this.repository.saveWindDownRuntimeState(state);
    });
  }
}
