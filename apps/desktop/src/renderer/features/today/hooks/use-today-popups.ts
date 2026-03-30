/**
 * Today page popup and notification hook.
 *
 * Monitors the today state for milestone changes (new streaks, streak
 * improvements, streak breaks) and shows toast notifications with mascot
 * images. Persists the last-seen UI snapshot to avoid duplicate popups
 * across re-renders.
 */
/* eslint-disable promise/prefer-await-to-then */

import { createElement, useEffect, useRef } from "react";
import { toast } from "sonner";

import { MASCOTS } from "@/renderer/assets/mascots";
import { createTodayUiSnapshot } from "@/renderer/features/today/lib/today-ui-snapshot";
import {
  readLastUiState,
  writeLastUiState,
} from "@/renderer/features/today/lib/today-ui-storage";
import type { TodayState } from "@/shared/contracts/habits-ipc";
import { isDailyHabit } from "@/shared/domain/habit";

const POPUP_TIMEOUT_MS = 5000;

function getMascotIconFilename(mascotUrl: string): string | undefined {
  try {
    const { pathname } = new URL(mascotUrl, window.location.href);
    const filename = pathname.split("/").pop();
    return filename || undefined;
  } catch {
    return undefined;
  }
}

interface UseTodayPopupsOptions {
  state: TodayState;
}

export function useTodayPopups({ state }: UseTodayPopupsOptions): void {
  const dailyHabits = state.habits.filter(isDailyHabit);
  const completedCount = dailyHabits.filter((habit) => habit.completed).length;
  const halfwayThreshold = Math.ceil(dailyHabits.length / 2);

  const initializedRef = useRef(false);
  const previousDailyProgressRef = useRef({
    completedCount,
    date: state.date,
  });

  const addPopup = (mascot: string, title: string, message: string) => {
    const iconFilename = getMascotIconFilename(mascot);
    const shouldShowDesktopNotification =
      document.visibilityState !== "visible" || !document.hasFocus();

    toast(title, {
      description: message,
      duration: POPUP_TIMEOUT_MS,
      icon: createElement("img", {
        alt: "",
        className: "size-12 shrink-0 rounded-xl object-contain",
        src: mascot,
      }),
    });

    if (!shouldShowDesktopNotification) {
      return;
    }

    window.habits.showNotification(title, message, iconFilename).catch(() => {
      // Desktop notifications are best-effort when the app is not frontmost.
    });
  };

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      const lastState = readLastUiState();

      if (lastState) {
        if (
          state.streak.currentStreak === 0 &&
          lastState.streak.currentStreak > 0
        ) {
          addPopup(
            MASCOTS.sad,
            "Streak Lost",
            "Your streak has been reset to 0."
          );
        } else if (
          state.streak.availableFreezes < lastState.streak.availableFreezes
        ) {
          addPopup(
            MASCOTS.freeze,
            "Streak Saved",
            "A freeze was automatically used to maintain your streak."
          );
        }
      }
    }
  }, [state.streak.availableFreezes, state.streak.currentStreak]);

  useEffect(() => {
    const previousDailyProgress = previousDailyProgressRef.current;

    if (previousDailyProgress.date !== state.date) {
      previousDailyProgressRef.current = {
        completedCount,
        date: state.date,
      };
      return;
    }

    if (
      completedCount === dailyHabits.length &&
      dailyHabits.length > 0 &&
      previousDailyProgress.completedCount < dailyHabits.length
    ) {
      addPopup(
        MASCOTS.flame,
        "Streak Maintained!",
        "You completed all your daily habits."
      );
    } else if (
      dailyHabits.length > 1 &&
      completedCount >= halfwayThreshold &&
      previousDailyProgress.completedCount < halfwayThreshold
    ) {
      addPopup(
        MASCOTS.determined,
        "Halfway there!",
        "You're doing great, keep it up."
      );
    }

    previousDailyProgressRef.current = {
      completedCount,
      date: state.date,
    };
  }, [completedCount, dailyHabits.length, halfwayThreshold, state.date]);

  useEffect(() => {
    writeLastUiState(createTodayUiSnapshot(state, completedCount));
  }, [completedCount, state]);
}
