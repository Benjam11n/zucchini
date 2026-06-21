import { toDateKeyInTimeZone } from "@/shared/domain/date-key";
import type {
  CreateFocusSessionInput,
  FocusSession,
} from "@/shared/domain/focus-session";
import type { PersistedFocusTimerState } from "@/shared/domain/focus-timer";
import { createFocusSessionInputSchema } from "@/shared/domain/schemas/focus-session";
import { persistedFocusTimerStateSchema } from "@/shared/domain/schemas/focus-timer";

import type { ApplicationServiceRuntime } from "./application-service-runtime";

function assertValidFocusSessionInput(input: CreateFocusSessionInput): void {
  const result = createFocusSessionInputSchema.safeParse(input);
  if (!result.success) {
    throw new Error(
      result.error.issues[0]?.message ?? "Focus session input is invalid."
    );
  }
}

function assertValidPersistedFocusTimerState(
  state: PersistedFocusTimerState
): void {
  if (!persistedFocusTimerStateSchema.safeParse(state).success) {
    throw new Error("Focus timer state is invalid.");
  }
}

export class FocusApplicationService {
  private readonly runtime: ApplicationServiceRuntime;

  constructor(runtime: ApplicationServiceRuntime) {
    this.runtime = runtime;
  }

  getFocusSessions(limit?: number): FocusSession[] {
    return this.runtime.inInitializedTransaction("getFocusSessions", () =>
      this.runtime.repository.focusSessions.listRecentSessions(limit)
    );
  }

  recordFocusSession(input: CreateFocusSessionInput): FocusSession {
    assertValidFocusSessionInput(input);

    return this.runtime.inInitializedTransaction("recordFocusSession", () => {
      const normalizedInput = {
        ...input,
        completedDate: toDateKeyInTimeZone(
          new Date(input.completedAt),
          this.runtime.getTimezone()
        ),
      };

      return this.runtime.repository.focusSessions.insertSession(
        normalizedInput
      );
    });
  }

  getPersistedFocusTimerState(): PersistedFocusTimerState | null {
    return this.runtime.inInitializedTransaction(
      "getPersistedFocusTimerState",
      () => this.runtime.repository.focusTimerState.getState()
    );
  }

  savePersistedFocusTimerState(
    state: PersistedFocusTimerState
  ): PersistedFocusTimerState {
    assertValidPersistedFocusTimerState(state);

    return this.runtime.inInitializedTransaction(
      "savePersistedFocusTimerState",
      () => this.runtime.repository.focusTimerState.saveState(state)
    );
  }
}
