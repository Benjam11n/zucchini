import type {
  AppCommand,
  ResultForAppCommandType,
} from "@/shared/contracts/ipc/app-command-registry";
import type {
  AppQuery,
  ResultForAppQueryType,
} from "@/shared/contracts/ipc/app-query-registry";
import type { ReminderRuntimeState } from "@/shared/domain/reminder-runtime-state";
import type { WindDownRuntimeState } from "@/shared/domain/wind-down-runtime-state";

export interface ApplicationService {
  execute<K extends AppCommand["type"]>(
    command: { [P in K]: Extract<AppCommand, { type: P }> }[K]
  ): ResultForAppCommandType<K>;
  read<K extends AppQuery["type"]>(
    query: { [P in K]: Extract<AppQuery, { type: P }> }[K]
  ): ResultForAppQueryType<K>;
  initialize(): void;
  getReminderRuntimeState(): ReminderRuntimeState;
  saveReminderRuntimeState(state: ReminderRuntimeState): void;
  getWindDownRuntimeState(): WindDownRuntimeState;
  saveWindDownRuntimeState(state: WindDownRuntimeState): void;
}
