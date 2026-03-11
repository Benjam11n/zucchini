import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
} from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import type { HabitWithStatus } from "@/shared/domain/habit";

import { reorderHabitList } from "./reorder-habits";
import { HabitCategorySelector, HabitFrequencySelector } from "./selectors";
import type { HabitManagementCardProps } from "./types";

interface HabitRowEditorProps extends Pick<
  HabitManagementCardProps,
  | "onArchiveHabit"
  | "onRenameHabit"
  | "onReorderHabits"
  | "onUpdateHabitCategory"
  | "onUpdateHabitFrequency"
> {
  habit: HabitWithStatus;
  habits: HabitWithStatus[];
  index: number;
}

export function HabitRowEditor({
  habit,
  habits,
  index,
  onArchiveHabit,
  onRenameHabit,
  onReorderHabits,
  onUpdateHabitCategory,
  onUpdateHabitFrequency,
}: HabitRowEditorProps) {
  return (
    <div>
      <Item variant="outline" className="bg-muted/20 p-4">
        <ItemContent className="gap-3">
          <div className="flex items-center gap-3">
            <Input
              className="h-8 max-w-[240px] text-sm"
              defaultValue={habit.name}
              id={`habit-name-${habit.id}`}
              onBlur={(event) => {
                void onRenameHabit(habit.id, event.target.value);
              }}
              required
              type="text"
            />
            <span className="shrink-0 text-xs text-muted-foreground">
              #{index + 1}
            </span>
          </div>

          <ItemDescription className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label className="mr-2 text-xs font-medium text-muted-foreground">
                Category
              </Label>
              <HabitCategorySelector
                name={`habit-category-${habit.id}`}
                onChange={(category) => {
                  void onUpdateHabitCategory(habit.id, category);
                }}
                selectedCategory={habit.category}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="mr-2 text-xs font-medium text-muted-foreground">
                Frequency
              </Label>
              <HabitFrequencySelector
                name={`habit-frequency-${habit.id}`}
                onChange={(frequency) => {
                  void onUpdateHabitFrequency(habit.id, frequency);
                }}
                selectedFrequency={habit.frequency}
              />
            </div>
          </ItemDescription>
        </ItemContent>

        <ItemActions className="self-end sm:self-center mt-3 sm:mt-0">
          <div className="flex gap-1.5 shrink-0">
            <Button
              className="h-7 px-2 text-xs"
              disabled={index === 0}
              onClick={() => {
                void onReorderHabits(reorderHabitList(habits, habit.id, -1));
              }}
              type="button"
              variant="outline"
            >
              ↑
            </Button>
            <Button
              className="h-7 px-2 text-xs"
              disabled={index === habits.length - 1}
              onClick={() => {
                void onReorderHabits(reorderHabitList(habits, habit.id, 1));
              }}
              type="button"
              variant="outline"
            >
              ↓
            </Button>
            <Button
              className="h-7 px-2 text-xs"
              onClick={() => {
                void onArchiveHabit(habit.id);
              }}
              type="button"
              variant="destructive"
            >
              Archive
            </Button>
          </div>
        </ItemActions>
      </Item>
    </div>
  );
}
