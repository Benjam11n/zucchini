import { m } from "framer-motion";
import { ChevronDown, Plus } from "lucide-react";
import { useEffect, useReducer, useRef } from "react";

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

import { HabitCategorySelector } from "./habit-category-selector";
import { HabitFrequencySelector } from "./habit-frequency-selector";
import type { HabitManagementCardProps } from "./habit-management.types";
import { HabitWeekdaySelector } from "./habit-weekday-selector";

const CREATION_FEEDBACK_TIMEOUT_MS = 2200;

interface NewHabitFormState {
  category: HabitCategory;
  creationFeedback: string | null;
  frequency: HabitFrequency;
  isAdvancedOpen: boolean;
  name: string;
  selectedWeekdays: HabitWeekday[] | null;
}

type NewHabitFormAction =
  | { type: "clearFeedback" }
  | { type: "setAdvancedOpen"; value: boolean }
  | { type: "setCategory"; value: HabitCategory }
  | { type: "setFrequency"; value: HabitFrequency }
  | { type: "setName"; value: string }
  | { type: "setWeekdays"; value: HabitWeekday[] | null }
  | { type: "submitSuccess"; createdHabitName: string };

const initialState: NewHabitFormState = {
  category: DEFAULT_HABIT_CATEGORY,
  creationFeedback: null,
  frequency: DEFAULT_HABIT_FREQUENCY,
  isAdvancedOpen: false,
  name: "",
  selectedWeekdays: null,
};

function reducer(
  state: NewHabitFormState,
  action: NewHabitFormAction
): NewHabitFormState {
  switch (action.type) {
    case "clearFeedback": {
      return {
        ...state,
        creationFeedback: null,
      };
    }
    case "setAdvancedOpen": {
      return {
        ...state,
        isAdvancedOpen: action.value,
      };
    }
    case "setCategory": {
      return {
        ...state,
        category: action.value,
      };
    }
    case "setFrequency": {
      return {
        ...state,
        frequency: action.value,
        selectedWeekdays:
          action.value === "daily" ? state.selectedWeekdays : null,
      };
    }
    case "setName": {
      return {
        ...state,
        name: action.value,
      };
    }
    case "setWeekdays": {
      return {
        ...state,
        selectedWeekdays: action.value,
      };
    }
    case "submitSuccess": {
      return {
        ...state,
        category: DEFAULT_HABIT_CATEGORY,
        creationFeedback: `Added "${action.createdHabitName}".`,
        frequency: DEFAULT_HABIT_FREQUENCY,
        name: "",
        selectedWeekdays: null,
      };
    }
    default: {
      return state;
    }
  }
}

export function NewHabitForm({
  onCreateHabit,
}: Pick<HabitManagementCardProps, "onCreateHabit">) {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!state.creationFeedback) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      dispatch({ type: "clearFeedback" });
    }, CREATION_FEEDBACK_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [state.creationFeedback]);

  async function handleCreate(): Promise<void> {
    const trimmedName = state.name.trim();
    if (!trimmedName) {
      return;
    }

    await onCreateHabit(
      trimmedName,
      state.category,
      state.frequency,
      state.frequency === "daily"
        ? normalizeHabitWeekdays(state.selectedWeekdays)
        : null
    );
    dispatch({
      createdHabitName: trimmedName,
      type: "submitSuccess",
    });
    nameInputRef.current?.focus();
  }

  return (
    <m.div
      className="grid w-full gap-3 self-start rounded-xl border border-border/70 bg-card/95 p-4 shadow-[0_16px_32px_-28px_rgba(15,23,42,0.9)] backdrop-blur"
      layout
      transition={microTransition}
    >
      <Collapsible
        open={state.isAdvancedOpen}
        onOpenChange={(value) => {
          dispatch({ type: "setAdvancedOpen", value });
        }}
      >
        <form
          className="grid gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            await handleCreate();
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
                    state.isAdvancedOpen && "rotate-180"
                  )}
                />
              </Button>
            </CollapsibleTrigger>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="grid gap-2">
              <Label
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                htmlFor="new-habit"
              >
                Name
              </Label>
              <Input
                ref={nameInputRef}
                className="h-10"
                id="new-habit"
                onChange={(event) => {
                  dispatch({
                    type: "setName",
                    value: event.target.value,
                  });
                }}
                placeholder="Eat zucchini..."
                required
                type="text"
                value={state.name}
              />
            </div>
            <Button
              className="h-10 px-4"
              disabled={!state.name.trim()}
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
              onChange={(value) => {
                dispatch({
                  type: "setCategory",
                  value,
                });
              }}
              selectedCategory={state.category}
            />
          </div>

          {state.creationFeedback ? (
            <p
              aria-live="polite"
              className="text-xs font-medium text-primary"
              role="status"
            >
              {state.creationFeedback}
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
                  onChange={(value) => {
                    dispatch({
                      type: "setFrequency",
                      value,
                    });
                  }}
                  selectedFrequency={state.frequency}
                />
              </div>

              {state.frequency === "daily" ? (
                <div className="grid gap-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Applies on
                  </Label>
                  <HabitWeekdaySelector
                    className="gap-1.5"
                    compact
                    name="new-habit-weekdays"
                    onChange={(value) => {
                      dispatch({
                        type: "setWeekdays",
                        value,
                      });
                    }}
                    selectedWeekdays={state.selectedWeekdays}
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
