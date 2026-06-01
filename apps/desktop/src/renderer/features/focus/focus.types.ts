/**
 * Focus page type definitions.
 *
 * Re-exports focus timer domain types and defines focus page action/view-model
 * contracts. Component prop types live beside their component.
 */
import type { AsyncPhase } from "@/renderer/shared/types/async-phase";
import type {
  CreateFocusSessionInput,
  FocusSession,
} from "@/shared/domain/focus-session";
import type {
  FocusBreakVariant,
  PersistedCompletedBreakState,
  PersistedFocusTimerState,
} from "@/shared/domain/focus-timer";
import type { GoalFrequency } from "@/shared/domain/goal";
import type { AppSettings } from "@/shared/domain/settings";

export type FocusSessionsPhase = AsyncPhase;
export type {
  FocusBreakVariant,
  PersistedCompletedBreakState,
  PersistedFocusTimerState,
};

export interface FocusTodaySummary {
  completedCount: number;
  totalMinutes: number;
}

export interface FocusPageActions {
  focusQuotaGoals?: {
    archive: (goalId: number) => Promise<void>;
    upsert: (frequency: GoalFrequency, targetMinutes: number) => Promise<void>;
  };
  focusTimer: {
    recordSession: (input: CreateFocusSessionInput) => Promise<FocusSession>;
    showWidget: () => Promise<void>;
  };
  sessions: {
    retryLoad: () => Promise<void>;
  };
  settings: {
    change: (settings: AppSettings) => void;
  };
}
