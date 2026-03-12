import { useEffect, useRef, useState } from "react";

import type { PopupEvent } from "@/renderer/features/today/today.types";
import { MASCOTS } from "@/renderer/shared/assets/mascots";
import type { TodayState } from "@/shared/contracts/habits-ipc";
import { isDailyHabit } from "@/shared/domain/habit";

import { readLastUiState, writeLastUiState } from "../lib/today-ui-storage";

const POPUP_TIMEOUT_MS = 5000;

interface UseTodayPopupsOptions {
  state: TodayState;
}

export function useTodayPopups({ state }: UseTodayPopupsOptions): PopupEvent[] {
  const dailyHabits = state.habits.filter(isDailyHabit);
  const completedCount = dailyHabits.filter((habit) => habit.completed).length;
  const halfwayThreshold = Math.ceil(dailyHabits.length / 2);

  const [popups, setPopups] = useState<PopupEvent[]>([]);
  const initializedRef = useRef(false);
  const popupTimeoutIdsRef = useRef<number[]>([]);
  const previousDailyProgressRef = useRef({
    completedCount,
    date: state.date,
  });

  const addPopup = (mascot: string, title: string, message: string) => {
    const id = crypto.randomUUID();
    setPopups((prev) => [...prev, { id, mascot, message, title }]);

    const timeoutId = window.setTimeout(() => {
      setPopups((prev) => prev.filter((popup) => popup.id !== id));
      popupTimeoutIdsRef.current = popupTimeoutIdsRef.current.filter(
        (existingId) => existingId !== timeoutId
      );
    }, POPUP_TIMEOUT_MS);
    popupTimeoutIdsRef.current.push(timeoutId);

    const iconFilename = mascot.startsWith("/mascot/")
      ? mascot.replace("/mascot/", "")
      : undefined;
    void window.habits.showNotification(title, message, iconFilename);
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

  useEffect(
    () => () => {
      for (const timeoutId of popupTimeoutIdsRef.current) {
        clearTimeout(timeoutId);
      }
      popupTimeoutIdsRef.current = [];
    },
    []
  );

  return popups;
}
