import { useForm } from "@tanstack/react-form";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Archive, MoonStar, Pencil, Plus } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { z } from "zod";

import { Button } from "@/renderer/shared/components/ui/button";
import { ConfirmIconButton } from "@/renderer/shared/components/ui/confirm-icon-button";
import {
  HabitListCard,
  HabitListItem,
} from "@/renderer/shared/components/ui/habit-list";
import { Input } from "@/renderer/shared/components/ui/input";
import {
  staggerContainerVariants,
  staggerItemVariants,
} from "@/renderer/shared/lib/motion";
import type { TodayState } from "@/shared/contracts/habits-ipc";
import type { HabitWithStatus } from "@/shared/domain/habit";
import { buildEmptyWindDownState } from "@/shared/domain/wind-down";

interface WindDownPageProps {
  onCreateAction: (name: string) => Promise<void>;
  onDeleteAction: (actionId: number) => Promise<void>;
  onRenameAction: (actionId: number, name: string) => Promise<void>;
  onToggleAction: (actionId: number) => void;
  state: TodayState;
}

async function runAction(action: () => Promise<void>): Promise<void> {
  try {
    await action();
  } catch {
    // Errors are surfaced by the app shell state.
  }
}

const newActionSchema = z.object({
  name: z.string().trim().min(1, "Action name is required."),
});

export function WindDownPage({
  onCreateAction,
  onDeleteAction,
  onRenameAction,
  onToggleAction,
  state,
}: WindDownPageProps) {
  const windDown = state.windDown ?? buildEmptyWindDownState(state.date);
  const [editingActionId, setEditingActionId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const activeEditingInput = useRef<HTMLInputElement | null>(null);
  const newActionForm = useForm({
    defaultValues: {
      name: "",
    },
    onSubmit: async ({ value }) => {
      await runAction(() => onCreateAction(value.name.trim()));
      newActionForm.reset();
    },
    validators: {
      onSubmit: newActionSchema,
    },
  });
  const handleEditingInputRef = useCallback((node: HTMLInputElement | null) => {
    if (!node || node === activeEditingInput.current) {
      return;
    }

    activeEditingInput.current = node;
    node.focus();
    node.select();
  }, []);
  const windDownChecklistHabits = useMemo(
    () =>
      windDown.actions.map(
        (action) =>
          ({
            category: "productivity",
            completed: action.completed,
            completedCount: action.completed ? 1 : 0,
            createdAt: action.createdAt,
            frequency: "daily",
            id: action.id,
            isArchived: false,
            name: action.name,
            sortOrder: action.sortOrder,
            targetCount: 1,
          }) satisfies HabitWithStatus
      ),
    [windDown.actions]
  );

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        animate="animate"
        className="grid gap-4"
        initial="initial"
        variants={staggerContainerVariants}
      >
        <m.section variants={staggerItemVariants}>
          <HabitListCard
            icon={MoonStar}
            progressLabel={`${windDown.completedCount}/${windDown.totalCount}`}
            progressValue={
              windDown.totalCount > 0
                ? Math.round(
                    (windDown.completedCount / windDown.totalCount) * 100
                  )
                : 0
            }
            title="Wind Down"
          >
            <div className="space-y-4">
              <form
                className="flex flex-col gap-3 sm:flex-row"
                onSubmit={async (event) => {
                  event.preventDefault();
                  await newActionForm.handleSubmit();
                }}
              >
                <newActionForm.Field name="name">
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;

                    return (
                      <>
                        <Input
                          aria-invalid={isInvalid}
                          onBlur={field.handleBlur}
                          onChange={(event) => {
                            field.handleChange(event.currentTarget.value);
                          }}
                          placeholder="Read a book..."
                          value={field.state.value}
                        />
                        <newActionForm.Subscribe
                          selector={(formState) => ({
                            isSubmitting: formState.isSubmitting,
                            name: formState.values.name,
                          })}
                        >
                          {(formState) => (
                            <Button
                              disabled={
                                formState.isSubmitting ||
                                formState.name.trim().length === 0
                              }
                              type="submit"
                            >
                              <Plus className="size-4" />
                              Add action
                            </Button>
                          )}
                        </newActionForm.Subscribe>
                      </>
                    );
                  }}
                </newActionForm.Field>
              </form>

              {windDownChecklistHabits.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground">
                  No wind down actions yet.
                </div>
              ) : (
                <div className="grid gap-px">
                  {windDownChecklistHabits.map((action) => {
                    const isEditing = editingActionId === action.id;

                    return isEditing ? (
                      <div key={action.id} className="rounded-md px-3 py-2.5">
                        <Input
                          onBlur={async () => {
                            const trimmedName = editingName.trim();
                            if (trimmedName) {
                              await runAction(() =>
                                onRenameAction(action.id, trimmedName)
                              );
                            }
                            setEditingActionId(null);
                          }}
                          onChange={(event) =>
                            setEditingName(event.currentTarget.value)
                          }
                          onKeyDown={async (event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              const trimmedName = editingName.trim();
                              if (trimmedName) {
                                await runAction(() =>
                                  onRenameAction(action.id, trimmedName)
                                );
                              }
                              setEditingActionId(null);
                            }
                          }}
                          ref={handleEditingInputRef}
                          value={editingName}
                        />
                      </div>
                    ) : (
                      <HabitListItem
                        key={action.id}
                        habit={action}
                        onToggle={onToggleAction}
                        trailingActions={
                          <>
                            <Button
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                setEditingActionId(action.id);
                                setEditingName(action.name);
                              }}
                              size="icon"
                              type="button"
                              variant="ghost"
                            >
                              <Pencil className="size-4" />
                              <span className="sr-only">
                                Edit {action.name}
                              </span>
                            </Button>
                            <ConfirmIconButton
                              confirmLabel={`Confirm delete ${action.name}`}
                              icon={<Archive className="size-4" />}
                              idleLabel={`Delete ${action.name}`}
                              onConfirm={async () => {
                                await runAction(() =>
                                  onDeleteAction(action.id)
                                );
                              }}
                              resetKey={action.id}
                              size="icon"
                              variant="destructive"
                            />
                          </>
                        }
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </HabitListCard>
        </m.section>
      </m.div>
    </LazyMotion>
  );
}
