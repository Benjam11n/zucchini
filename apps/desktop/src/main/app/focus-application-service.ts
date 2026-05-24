import { toDateKeyInTimeZone } from "@/shared/domain/date-key";
import type {
  CreateFocusSessionInput,
  FocusSession,
} from "@/shared/domain/focus-session";
import type { PersistedFocusTimerState } from "@/shared/domain/focus-timer";
import { createFocusSessionInputSchema } from "@/shared/domain/schemas/focus-session";
import { persistedFocusTimerStateSchema } from "@/shared/domain/schemas/focus-timer";

import { ApplicationServiceSlice } from "./application-service-slice";

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

export class FocusApplicationService extends ApplicationServiceSlice {
  getFocusSessions(limit?: number): FocusSession[] {
    return this.inInitializedTransaction("getFocusSessions", () =>
      this.repository.getFocusSessions(limit)
    );
  }

  recordFocusSession(input: CreateFocusSessionInput): FocusSession {
    assertValidFocusSessionInput(input);

    return this.inInitializedTransaction("recordFocusSession", () => {
      const normalizedInput = {
        ...input,
        completedDate: toDateKeyInTimeZone(
          new Date(input.completedAt),
          this.getTimezone()
        ),
      };

      return this.repository.saveFocusSession(normalizedInput);
    });
  }

  getPersistedFocusTimerState(): PersistedFocusTimerState | null {
    return this.inInitializedTransaction("getPersistedFocusTimerState", () =>
      this.repository.getPersistedFocusTimerState()
    );
  }

  savePersistedFocusTimerState(
    state: PersistedFocusTimerState
  ): PersistedFocusTimerState {
    assertValidPersistedFocusTimerState(state);

    return this.inInitializedTransaction("savePersistedFocusTimerState", () =>
      this.repository.savePersistedFocusTimerState(state)
    );
  }
}
