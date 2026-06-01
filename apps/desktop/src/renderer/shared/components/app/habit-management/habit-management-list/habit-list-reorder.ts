import type { Habit } from "@/shared/domain/habit";

export function mergeReorderedFrequencySection(
  habits: Habit[],
  sectionHabits: Habit[]
): Habit[] {
  const [firstSectionHabit] = sectionHabits;

  if (!firstSectionHabit) {
    return habits;
  }

  const sectionFrequency = firstSectionHabit.frequency;
  const remainingSectionHabits = [...sectionHabits];

  return habits.map((habit, index) => {
    if (habit.frequency !== sectionFrequency) {
      return {
        ...habit,
        sortOrder: index,
      };
    }

    const nextHabit = remainingSectionHabits.shift() ?? habit;
    return {
      ...nextHabit,
      sortOrder: index,
    };
  });
}
