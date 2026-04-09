import { useForm } from "@tanstack/react-form";
import { m } from "framer-motion";
import { ChevronDown, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/renderer/shared/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/renderer/shared/components/ui/collapsible";
import { Input } from "@/renderer/shared/components/ui/input";
import { Label } from "@/renderer/shared/components/ui/label";
import { cn } from "@/renderer/shared/lib/class-names";
import { microTransition } from "@/renderer/shared/lib/motion";
import { habitNameSchema } from "@/shared/contracts/habits-ipc-schema";
import {
  DEFAULT_HABIT_CATEGORY,
  DEFAULT_HABIT_FREQUENCY,
  normalizeHabitTargetCount,
  normalizeHabitWeekdays,
} from "@/shared/domain/habit";
import type {
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";

import { HabitCategorySelector } from "./habit-category-selector";
import { HabitFrequencySelector } from "./habit-frequency-selector";
import type { HabitManagementCardProps } from "./habit-management.types";
import { HabitTargetCountStepper } from "./habit-target-count-stepper";
import { HabitWeekdaySelector } from "./habit-weekday-selector";

const CREATION_FEEDBACK_TIMEOUT_MS = 2200;

interface NewHabitFormValues {
  category: HabitCategory;
  frequency: HabitFrequency;
  name: string;
  selectedWeekdays: HabitWeekday[] | null;
  targetCount: number;
}

const defaultValues: NewHabitFormValues = {
  category: DEFAULT_HABIT_CATEGORY,
  frequency: DEFAULT_HABIT_FREQUENCY,
  name: "",
  selectedWeekdays: null,
  targetCount: 1,
};

function getHabitNameError(name: string): string | null {
  const result = habitNameSchema.safeParse(name);

  if (result.success) {
    return null;
  }

  const [issue] = result.error.issues;

  return issue?.message ?? "Habit names must be valid.";
}

export function NewHabitForm({
  onCreateHabit,
}: Pick<HabitManagementCardProps, "onCreateHabit">) {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [creationFeedback, setCreationFeedback] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const trimmedName = value.name.trim();
      const nextNameError = getHabitNameError(trimmedName);

      if (nextNameError) {
        setNameError(nextNameError);
        return;
      }

      await onCreateHabit(
        trimmedName,
        value.category,
        value.frequency,
        value.frequency === "daily"
          ? normalizeHabitWeekdays(value.selectedWeekdays)
          : null,
        value.frequency === "daily" ? 1 : value.targetCount
      );

      form.reset();
      setNameError(null);
      setCreationFeedback(`Added "${trimmedName}".`);
      nameInputRef.current?.focus();
    },
  });

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!creationFeedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCreationFeedback(null);
    }, CREATION_FEEDBACK_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [creationFeedback]);

  return (
    <m.div
      className="grid w-full gap-3 self-start rounded-xl border border-border/70 bg-card/95 p-4 shadow-[0_16px_32px_-28px_rgba(15,23,42,0.9)] backdrop-blur"
      layout
      transition={microTransition}
    >
      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <form
          className="grid gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            await form.handleSubmit();
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
            <form.Field name="name">
              {(field) => (
                <>
                  <div className="grid gap-2">
                    <Label
                      className="text-xs font-medium text-muted-foreground"
                      htmlFor="new-habit"
                    >
                      Name
                    </Label>
                    <Input
                      aria-describedby={
                        nameError ? "new-habit-name-error" : undefined
                      }
                      aria-invalid={nameError ? "true" : undefined}
                      ref={nameInputRef}
                      className="h-10"
                      id="new-habit"
                      onBlur={field.handleBlur}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        field.handleChange(nextValue);
                        setNameError(getHabitNameError(nextValue.trim()));
                        if (creationFeedback) {
                          setCreationFeedback(null);
                        }
                      }}
                      placeholder="Eat zucchini..."
                      required
                      type="text"
                      value={field.state.value}
                    />
                    {nameError ? (
                      <p
                        className="text-xs font-medium text-destructive"
                        id="new-habit-name-error"
                      >
                        {nameError}
                      </p>
                    ) : null}
                  </div>
                  <form.Subscribe
                    selector={(state) => ({
                      isNameValid: !getHabitNameError(state.values.name.trim()),
                      isSubmitting: state.isSubmitting,
                      name: state.values.name,
                    })}
                  >
                    {(state) => (
                      <Button
                        className="h-10 px-4"
                        disabled={
                          state.isSubmitting ||
                          state.name.trim().length === 0 ||
                          !state.isNameValid
                        }
                        type="submit"
                      >
                        <Plus className="size-4" />
                        Add habit
                      </Button>
                    )}
                  </form.Subscribe>
                </>
              )}
            </form.Field>
          </div>

          <form.Subscribe selector={(state) => state.values}>
            {(values) => (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <form.Field name="category">
                    {(field) => (
                      <div className="grid gap-2">
                        <Label className="text-xs font-medium text-muted-foreground">
                          Category
                        </Label>
                        <HabitCategorySelector
                          className="gap-1.5"
                          compact
                          name="new-habit-category"
                          onChange={field.handleChange}
                          selectedCategory={field.state.value}
                        />
                      </div>
                    )}
                  </form.Field>

                  <form.Field name="frequency">
                    {(field) => (
                      <div className="grid gap-2">
                        <Label className="text-xs font-medium text-muted-foreground">
                          Frequency
                        </Label>
                        <HabitFrequencySelector
                          className="gap-1.5"
                          compact
                          name="new-habit-frequency"
                          onChange={(value) => {
                            field.handleChange(value);
                            form.setFieldValue(
                              "selectedWeekdays",
                              value === "daily" ? values.selectedWeekdays : null
                            );
                            form.setFieldValue(
                              "targetCount",
                              normalizeHabitTargetCount(
                                value,
                                values.targetCount
                              )
                            );
                          }}
                          selectedFrequency={field.state.value}
                        />
                      </div>
                    )}
                  </form.Field>
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
                    {values.frequency === "daily" ? (
                      <form.Field name="selectedWeekdays">
                        {(field) => (
                          <div className="grid gap-2">
                            <Label className="text-xs font-medium text-muted-foreground">
                              Applies on
                            </Label>
                            <HabitWeekdaySelector
                              className="gap-1.5"
                              compact
                              name="new-habit-weekdays"
                              onChange={field.handleChange}
                              selectedWeekdays={field.state.value}
                            />
                          </div>
                        )}
                      </form.Field>
                    ) : (
                      <form.Field name="targetCount">
                        {(field) => (
                          <div className="grid gap-2">
                            <Label className="text-xs font-medium text-muted-foreground">
                              Goal
                            </Label>
                            <HabitTargetCountStepper
                              compact
                              frequency={
                                values.frequency as Exclude<
                                  HabitFrequency,
                                  "daily"
                                >
                              }
                              onChange={(value) => {
                                field.handleChange(
                                  normalizeHabitTargetCount(
                                    values.frequency,
                                    value
                                  )
                                );
                              }}
                              value={field.state.value}
                            />
                          </div>
                        )}
                      </form.Field>
                    )}
                  </div>
                </CollapsibleContent>
              </>
            )}
          </form.Subscribe>
        </form>
      </Collapsible>
    </m.div>
  );
}
