import { AnimatePresence, motion } from "framer-motion";
import { ListChecks } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { HabitChecklist } from "@/components/habit-checklist";
import { LongerHabitChecklist } from "@/components/longer-habit-checklist";
import { StreakCard } from "@/components/streak-card";
import { MASCOTS } from "@/renderer/lib/mascots";
import {
  staggerContainerVariants,
  staggerItemVariants,
} from "@/renderer/lib/motion";
import { getHabitCategoryProgress, isDailyHabit } from "@/shared/domain/habit";
import type { TodayState } from "@/shared/types/ipc";

const LAST_STATE_STORAGE_KEY = "zucchini_last_state";
const POPUP_TIMEOUT_MS = 5000;

interface PopupEvent {
  id: string;
  mascot: string;
  message: string;
  title: string;
}

interface PersistedTodayUiState {
  completedCount: number;
  date: string;
  streak: TodayState["streak"];
}

interface TodayPageProps {
  state: TodayState;
  onToggleHabit: (habitId: number) => void;
}

function isPersistedTodayUiState(
  value: unknown
): value is PersistedTodayUiState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PersistedTodayUiState>;
  return (
    typeof candidate.completedCount === "number" &&
    typeof candidate.date === "string" &&
    !!candidate.streak &&
    typeof candidate.streak.currentStreak === "number" &&
    typeof candidate.streak.availableFreezes === "number"
  );
}

function readLastUiState(): PersistedTodayUiState | null {
  try {
    const rawValue = localStorage.getItem(LAST_STATE_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    return isPersistedTodayUiState(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

function writeLastUiState(value: PersistedTodayUiState): void {
  try {
    localStorage.setItem(LAST_STATE_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Ignore storage failures; popup history is only best-effort UI memory.
  }
}

export function TodayPage({ state, onToggleHabit }: TodayPageProps) {
  const dailyHabits = state.habits.filter(isDailyHabit);
  const periodicHabits = state.habits.filter((habit) => !isDailyHabit(habit));
  const categoryProgress = getHabitCategoryProgress(dailyHabits);
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
      setPopups((prev) => prev.filter((p) => p.id !== id));
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

  return (
    <>
      <motion.div
        animate="animate"
        className="grid gap-6"
        initial="initial"
        variants={staggerContainerVariants}
      >
        <motion.section variants={staggerItemVariants}>
          <StreakCard
            availableFreezes={state.streak.availableFreezes}
            currentStreak={state.streak.currentStreak}
            categoryProgress={categoryProgress}
            dateLabel={state.date}
          />
        </motion.section>

        <motion.section variants={staggerItemVariants}>
          <HabitChecklist
            icon={ListChecks}
            completedCount={completedCount}
            emptyMessage="No daily habits yet. Add one in Settings to power the rings and streak."
            habits={dailyHabits}
            onToggleHabit={onToggleHabit}
          />
        </motion.section>

        {periodicHabits.length > 0 ? (
          <motion.section variants={staggerItemVariants}>
            <LongerHabitChecklist
              dateKey={state.date}
              habits={periodicHabits}
              onToggleHabit={onToggleHabit}
            />
          </motion.section>
        ) : null}
      </motion.div>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {popups.map((popup) => (
            <motion.div
              key={popup.id}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="flex w-88 pointer-events-auto items-center gap-4 rounded-2xl border border-border/60 bg-card p-4 shadow-lg"
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
            >
              <img
                alt="Mascot"
                className="size-16 shrink-0 object-contain drop-shadow-sm"
                src={popup.mascot}
              />
              <div className="grid gap-1">
                <h4 className="text-sm font-bold text-foreground">
                  {popup.title}
                </h4>
                <p className="text-xs text-muted-foreground">{popup.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
