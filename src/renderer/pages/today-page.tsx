import { motion } from "framer-motion";

import { HabitChecklist } from "@/components/habit-checklist";
import { StreakCard } from "@/components/streak-card";
import {
  staggerContainerVariants,
  staggerItemVariants,
} from "@/renderer/lib/motion";
import { getHabitCategoryProgress } from "@/shared/domain/habit";
import type { TodayState } from "@/shared/types/ipc";

interface TodayPageProps {
  state: TodayState;
  onToggleHabit: (habitId: number) => void;
}

export function TodayPage({ state, onToggleHabit }: TodayPageProps) {
  const categoryProgress = getHabitCategoryProgress(state.habits);
  const completedCount = state.habits.filter((habit) => habit.completed).length;

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
          habits={state.habits}
          onToggleHabit={onToggleHabit}
        />
      </motion.section>
    </motion.div>
  );
}
