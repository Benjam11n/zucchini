import { createElement, useEffect, useRef } from "react";
import { toast } from "sonner";

import {
  readLastUiState,
  writeLastUiState,
} from "@/renderer/features/today/lib/today-ui-storage";
import { MASCOTS } from "@/renderer/shared/assets/mascots";
import type { TodayState } from "@/shared/contracts/habits-ipc";
import { isDailyHabit } from "@/shared/domain/habit";

const POPUP_TIMEOUT_MS = 5000;

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
    const iconFilename = mascot.startsWith("/mascot/")
      ? mascot.replace("/mascot/", "")
      : undefined;

    toast(title, {
      description: message,
      duration: POPUP_TIMEOUT_MS,
      icon: createElement("img", {
        alt: "",
        className: "size-12 shrink-0 rounded-xl object-contain",
        src: mascot,
      }),
    });

    window.habits.showNotification(title, message, iconFilename).catch(() => {
      // Desktop notifications are best-effort alongside the in-app toast.
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
    writeLastUiState({
      completedCount,
      date: state.date,
      streak: state.streak,
    });
  }, [completedCount, state.date, state.streak]);
}
