import type { HabitWithStatus } from "../../shared/domain/habit";

interface HabitChecklistProps {
  habits: HabitWithStatus[];
  onToggleHabit: (habitId: number) => void;
}

export function HabitChecklist({ habits, onToggleHabit }: HabitChecklistProps) {
  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Checklist</p>
          <h2>Today&apos;s habits</h2>
        </div>
      </div>

      <div className="habit-list">
        {habits.map((habit) => (
          <label className="habit-item" key={habit.id}>
            <input
              checked={habit.completed}
              onChange={() => onToggleHabit(habit.id)}
              type="checkbox"
            />
            <span>{habit.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
