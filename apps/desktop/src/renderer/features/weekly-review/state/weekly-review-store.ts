/**
 * Weekly review Zustand store.
 *
 * Manages the weekly review overview loading, individual weekly review
 * selection, and the spotlight dialog visibility. Provides actions for
 * loading the overview, selecting a specific week, and opening/closing
 * the spotlight.
 */
import { create } from "zustand";

import { loadWeeklyReviewState } from "@/renderer/features/weekly-review/lib/weekly-review-state";
import { appClient } from "@/renderer/shared/lib/app-client";
import { runAppIpcTask } from "@/renderer/shared/lib/app-ipc-task";
import type { AsyncPhase } from "@/renderer/shared/types/async-phase";
import type { AppIpcError } from "@/shared/contracts/ipc/app-errors";
import type {
  WeeklyReview,
  WeeklyReviewOverview,
} from "@/shared/domain/weekly-review";

interface WeeklyReviewStoreState {
  isWeeklyReviewSpotlightOpen: boolean;
  selectedWeeklyReview: WeeklyReview | null;
  weeklyReviewError: AppIpcError | null;
  weeklyReviewOverview: WeeklyReviewOverview | null;
  weeklyReviewPhase: AsyncPhase;
  dismissWeeklyReviewSpotlight: () => void;
  loadWeeklyReviewOverview: (options?: { force?: boolean }) => Promise<void>;
  openWeeklyReviewSpotlight: () => void;
  selectWeeklyReview: (weekStart: string) => Promise<void>;
}

function getInitialWeeklyReviewState(): Pick<
  WeeklyReviewStoreState,
  | "isWeeklyReviewSpotlightOpen"
  | "selectedWeeklyReview"
  | "weeklyReviewError"
  | "weeklyReviewOverview"
  | "weeklyReviewPhase"
> {
  return {
    isWeeklyReviewSpotlightOpen: false,
    selectedWeeklyReview: null,
    weeklyReviewError: null,
    weeklyReviewOverview: null,
    weeklyReviewPhase: "idle",
  };
}

export const useWeeklyReviewStore = create<WeeklyReviewStoreState>()(
  (set, get) => ({
    ...getInitialWeeklyReviewState(),
    dismissWeeklyReviewSpotlight: () =>
      set({
        isWeeklyReviewSpotlightOpen: false,
      }),
    loadWeeklyReviewOverview: async (options = {}) => {
      const { weeklyReviewOverview, weeklyReviewPhase } = get();
      if (weeklyReviewPhase === "loading") {
        return;
      }
      if (
        !options.force &&
        weeklyReviewPhase === "ready" &&
        weeklyReviewOverview
      ) {
        return;
      }

      await runAppIpcTask(
        () => loadWeeklyReviewState(appClient, get().selectedWeeklyReview),
        {
          onError: (weeklyReviewError) => {
            set({
              selectedWeeklyReview: null,
              weeklyReviewError,
              weeklyReviewOverview: null,
              weeklyReviewPhase: "error",
            });
          },
          onStart: () => {
            set({
              weeklyReviewError: null,
              weeklyReviewPhase: "loading",
            });
          },
          onSuccess: (weeklyReviewState) => {
            set({
              selectedWeeklyReview: weeklyReviewState.selectedWeeklyReview,
              weeklyReviewError: null,
              weeklyReviewOverview: weeklyReviewState.overview,
              weeklyReviewPhase: "ready",
            });
          },
        }
      );
    },
    openWeeklyReviewSpotlight: () =>
      set({
        isWeeklyReviewSpotlightOpen: true,
      }),
    selectWeeklyReview: async (weekStart: string) => {
      const currentReview = get().selectedWeeklyReview;
      if (currentReview?.weekStart === weekStart) {
        return;
      }

      await runAppIpcTask(() => appClient.getWeeklyReview(weekStart), {
        onError: (weeklyReviewError) => {
          set({
            weeklyReviewError,
            weeklyReviewPhase: "error",
          });
        },
        onStart: () => {
          set({
            weeklyReviewError: null,
            weeklyReviewPhase: "loading",
          });
        },
        onSuccess: (selectedWeeklyReview) => {
          set({
            selectedWeeklyReview,
            weeklyReviewError: null,
            weeklyReviewPhase: "ready",
          });
        },
      });
    },
  })
);
