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

interface PopupEvent {
  id: number;
  mascot: string;
  message: string;
  title: string;
}

interface TodayPageProps {
  state: TodayState;
  onToggleHabit: (habitId: number) => void;
}

export function TodayPage({ state, onToggleHabit }: TodayPageProps) {
  const dailyHabits = state.habits.filter(isDailyHabit);
  const periodicHabits = state.habits.filter((habit) => !isDailyHabit(habit));
  const categoryProgress = getHabitCategoryProgress(dailyHabits);
  const completedCount = dailyHabits.filter((habit) => habit.completed).length;

  const [popups, setPopups] = useState<PopupEvent[]>([]);
  const initializedRef = useRef(false);
  const prevCompletedCountRef = useRef(completedCount);

  const addPopup = (mascot: string, title: string, message: string) => {
    const id = Date.now() + Math.random();
    setPopups((prev) => [...prev, { id, mascot, message, title }]);

    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== id));
    }, 5000);

    const iconFilename = mascot.startsWith("/mascot/") ? mascot.replace("/mascot/", "") : undefined;
    void window.habits.showNotification(title, message, iconFilename);
  };

  useEffect(() => {
    const rawLastState = localStorage.getItem("zucchini_last_state");
    const lastState = rawLastState ? JSON.parse(rawLastState) : null;

    if (!initializedRef.current) {
      initializedRef.current = true;
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
    } else if (
      completedCount === dailyHabits.length &&
      dailyHabits.length > 0 &&
      prevCompletedCountRef.current < dailyHabits.length
    ) {
      addPopup(
        MASCOTS.flame,
        "Streak Maintained!",
        "You completed all your daily habits."
      );
    } else if (
      dailyHabits.length > 1 &&
      completedCount >= Math.floor(dailyHabits.length / 2) &&
      prevCompletedCountRef.current < Math.floor(dailyHabits.length / 2)
    ) {
      addPopup(
        MASCOTS.determined,
        "Halfway there!",
        "You're doing great, keep it up."
      );
    }

    prevCompletedCountRef.current = completedCount;
    localStorage.setItem(
      "zucchini_last_state",
      JSON.stringify({
        completedCount,
        date: state.date,
        streak: state.streak,
      })
    );
  }, [state.date, state.streak, completedCount, dailyHabits.length]);

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
