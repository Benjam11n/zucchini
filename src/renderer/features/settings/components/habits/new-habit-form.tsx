import { m } from "framer-motion";
import { ChevronDown, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { HabitManagementCardProps } from "@/renderer/features/settings/settings.types";
import { cn } from "@/renderer/shared/lib/class-names";
import { microTransition } from "@/renderer/shared/lib/motion";
import { Button } from "@/renderer/shared/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/renderer/shared/ui/collapsible";
import { Input } from "@/renderer/shared/ui/input";
import { Label } from "@/renderer/shared/ui/label";
import {
  DEFAULT_HABIT_CATEGORY,
  DEFAULT_HABIT_FREQUENCY,
  normalizeHabitWeekdays,
} from "@/shared/domain/habit";
import type {
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";

import {
  HabitCategorySelector,
  HabitFrequencySelector,
  HabitWeekdaySelector,
} from "./habit-category-selector";

export function NewHabitForm({
  onCreateHabit,
}: Pick<HabitManagementCardProps, "onCreateHabit">) {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitCategory, setNewHabitCategory] = useState<HabitCategory>(
    DEFAULT_HABIT_CATEGORY
  );
  const [newHabitFrequency, setNewHabitFrequency] = useState<HabitFrequency>(
    DEFAULT_HABIT_FREQUENCY
  );
  const [newHabitSelectedWeekdays, setNewHabitSelectedWeekdays] = useState<
    HabitWeekday[] | null
  >(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [shouldRestoreFocus, setShouldRestoreFocus] = useState(false);
  const [creationFeedback, setCreationFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!shouldRestoreFocus) {
      return;
    }

    nameInputRef.current?.focus();
    setShouldRestoreFocus(false);
  }, [shouldRestoreFocus]);

  useEffect(
    () => () => {
      if (feedbackTimeoutRef.current === null) {
        return;
      }

      window.clearTimeout(feedbackTimeoutRef.current);
    },
    []
  );

  async function handleCreate(): Promise<void> {
    if (!newHabitName.trim()) {
      return;
    }

    const createdHabitName = newHabitName.trim();
    await onCreateHabit(
      createdHabitName,
      newHabitCategory,
      newHabitFrequency,
      newHabitFrequency === "daily"
        ? normalizeHabitWeekdays(newHabitSelectedWeekdays)
        : null
    );
    setNewHabitName("");
    setNewHabitCategory(DEFAULT_HABIT_CATEGORY);
    setNewHabitFrequency(DEFAULT_HABIT_FREQUENCY);
    setNewHabitSelectedWeekdays(null);
    setShouldRestoreFocus(true);
    setCreationFeedback(`Added "${createdHabitName}".`);

    if (feedbackTimeoutRef.current !== null) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }

    feedbackTimeoutRef.current = window.setTimeout(() => {
      setCreationFeedback(null);
      feedbackTimeoutRef.current = null;
    }, 2200);
  }

  return (
    <m.div
      className="grid w-full gap-3 self-start rounded-2xl border border-border/70 bg-card/95 p-4 shadow-[0_16px_32px_-28px_rgba(15,23,42,0.9)] backdrop-blur sm:max-w-3xl"
      layout
      transition={microTransition}
    >
      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void handleCreate();
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-sm font-medium">Add a habit</p>
            <CollapsibleTrigger asChild>
              <Button size="sm" type="button" variant="ghost">
                More options
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform",
                    isAdvancedOpen && "rotate-180"
                  )}
                />
              </Button>
            </CollapsibleTrigger>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="grid gap-2">
              <Label
                className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase"
                htmlFor="new-habit"
              >
                Name
              </Label>
              <Input
                ref={nameInputRef}
                className="h-10"
                id="new-habit"
                onChange={(event) => setNewHabitName(event.target.value)}
                placeholder="Eat zucchini..."
                required
                type="text"
                value={newHabitName}
              />
            </div>
            <Button
              className="h-10 px-4"
              disabled={!newHabitName.trim()}
              type="submit"
            >
              <Plus className="size-4" />
              Add habit
            </Button>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Category
            </Label>
            <HabitCategorySelector
              className="gap-1.5"
              compact
              name="new-habit-category"
              onChange={setNewHabitCategory}
              selectedCategory={newHabitCategory}
            />
          </div>

          {creationFeedback ? (
            <p
              aria-live="polite"
              className="text-xs font-medium text-primary"
              role="status"
            >
              {creationFeedback}
            </p>
          ) : null}

          <CollapsibleContent className="grid gap-3 border-t border-border/60 pt-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Frequency
                </Label>
                <HabitFrequencySelector
                  className="gap-1.5"
                  compact
                  name="new-habit-frequency"
                  onChange={(frequency) => {
                    setNewHabitFrequency(frequency);
                    if (frequency !== "daily") {
                      setNewHabitSelectedWeekdays(null);
                    }
                  }}
                  selectedFrequency={newHabitFrequency}
                />
              </div>

              {newHabitFrequency === "daily" ? (
                <div className="grid gap-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Applies on
                  </Label>
                  <HabitWeekdaySelector
                    className="gap-1.5"
                    compact
                    name="new-habit-weekdays"
                    onChange={setNewHabitSelectedWeekdays}
                    selectedWeekdays={newHabitSelectedWeekdays}
                  />
                </div>
              ) : null}
            </div>
          </CollapsibleContent>
        </form>
      </Collapsible>
    </m.div>
  );
}
