import { motion } from "framer-motion";

import { HabitChecklist } from "@/components/habit-checklist";
import { PeriodHabitBoard } from "@/components/period-habit-board";
import { StreakCard } from "@/components/streak-card";
import {
  staggerContainerVariants,
  staggerItemVariants,
} from "@/renderer/lib/motion";
import { getHabitCategoryProgress, isDailyHabit } from "@/shared/domain/habit";
import type { TodayState } from "@/shared/types/ipc";

interface TodayPageProps {
  state: TodayState;
  onToggleHabit: (habitId: number) => void;
}

export function TodayPage({ state, onToggleHabit }: TodayPageProps) {
  const dailyHabits = state.habits.filter(isDailyHabit);
  const periodicHabits = state.habits.filter((habit) => !isDailyHabit(habit));
  const categoryProgress = getHabitCategoryProgress(dailyHabits);
  const completedCount = dailyHabits.filter((habit) => habit.completed).length;

  return (
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
          completedCount={completedCount}
          emptyMessage="No daily habits yet. Add one in Settings to power the rings and streak."
          habits={dailyHabits}
          onToggleHabit={onToggleHabit}
        />
      </motion.section>

      {periodicHabits.length > 0 ? (
        <motion.section variants={staggerItemVariants}>
          <PeriodHabitBoard
            dateKey={state.date}
            habits={periodicHabits}
            onToggleHabit={onToggleHabit}
          />
        </motion.section>
      ) : null}
    </motion.div>
  );
}
