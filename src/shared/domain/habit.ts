export type Habit = {
  id: number;
  name: string;
  sortOrder: number;
  isArchived: boolean;
  createdAt: string;
};

export type HabitWithStatus = Habit & {
  completed: boolean;
};
