import { AnimatePresence, LayoutGroup } from "framer-motion";
import { useEffect, useRef } from "react";

import type {
  HabitCategory,
  HabitFrequency,
  HabitWeekday,
} from "@/shared/domain/habit";

import type {
  HabitDragState,
  RecentArchivedHabit,
} from "./habit-management-content.types";
import { HabitManagementListItem } from "./habit-management-list-item";
import type { HabitManagementCardProps } from "./habit-management.types";

const AUTO_SCROLL_EDGE_THRESHOLD_PX = 72;
const AUTO_SCROLL_MAX_STEP_PX = 18;

function isScrollableElement(element: HTMLElement): boolean {
  const { overflowY } = window.getComputedStyle(element);
  return (
    /(auto|overlay|scroll)/.test(overflowY) &&
    element.scrollHeight > element.clientHeight
  );
}

function findScrollableAncestor(
  element: HTMLElement | null
): HTMLElement | null {
  let current = element?.parentElement ?? null;

  while (current) {
    if (isScrollableElement(current)) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}

function getAutoScrollStep(
  clientY: number,
  top: number,
  bottom: number
): number {
  if (clientY <= top + AUTO_SCROLL_EDGE_THRESHOLD_PX) {
    const distance = Math.max(clientY - top, 0);
    const intensity = 1 - distance / AUTO_SCROLL_EDGE_THRESHOLD_PX;
    return -Math.ceil(intensity * AUTO_SCROLL_MAX_STEP_PX);
  }

  if (clientY >= bottom - AUTO_SCROLL_EDGE_THRESHOLD_PX) {
    const distance = Math.max(bottom - clientY, 0);
    const intensity = 1 - distance / AUTO_SCROLL_EDGE_THRESHOLD_PX;
    return Math.ceil(intensity * AUTO_SCROLL_MAX_STEP_PX);
  }

  return 0;
}

const HABIT_FREQUENCY_SECTIONS = [
  {
    description: "Scheduled for specific days.",
    frequency: "daily",
    title: "Daily",
  },
  {
    description: "Track weekly targets together.",
    frequency: "weekly",
    title: "Weekly",
  },
  {
    description: "Longer-cycle habits with monthly targets.",
    frequency: "monthly",
    title: "Monthly",
  },
] as const;

export interface HabitManagementListProps {
  dragState: HabitDragState;
  expandedHabitId: number | null;
  habits: HabitManagementCardProps["habits"];
  onArchiveHabit: (
    habitId: number,
    habitName: string,
    frequency: HabitFrequency,
    index: number
  ) => Promise<void>;
  onDragStateChange: (dragState: HabitDragState) => void;
  onDrop: (
    draggedHabitId: number | null,
    targetHabitId: number,
    position: "after" | "before"
  ) => Promise<void>;
  onExpandedHabitChange: (habitId: number | null) => void;
  onRenameHabit: (habitId: number, name: string) => Promise<void>;
  onReorderHabits: (
    habits: HabitManagementCardProps["habits"]
  ) => Promise<void>;
  onUndoArchive: () => Promise<void>;
  onUpdateHabitCategory: (
    habitId: number,
    category: HabitCategory,
    habitName: string
  ) => Promise<void>;
  onUpdateHabitFrequency: (
    habitId: number,
    frequency: HabitFrequency,
    targetCount: number | null | undefined,
    habitName: string
  ) => Promise<void>;
  onUpdateHabitTargetCount: (
    habitId: number,
    targetCount: number,
    habitName: string
  ) => Promise<void>;
  onUpdateHabitWeekdays: (
    habitId: number,
    selectedWeekdays: HabitWeekday[] | null,
    habitName: string
  ) => Promise<void>;
  recentArchivedHabit: RecentArchivedHabit | null;
}

export function HabitManagementList({
  dragState,
  expandedHabitId,
  habits,
  onArchiveHabit,
  onDragStateChange,
  onDrop,
  onExpandedHabitChange,
  onRenameHabit,
  onReorderHabits,
  onUndoArchive,
  onUpdateHabitCategory,
  onUpdateHabitFrequency,
  onUpdateHabitTargetCount,
  onUpdateHabitWeekdays,
  recentArchivedHabit,
}: HabitManagementListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const autoScrollFrameRef = useRef<number | null>(null);
  const dragClientYRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (autoScrollFrameRef.current !== null) {
        window.cancelAnimationFrame(autoScrollFrameRef.current);
      }
    },
    []
  );

  function stopAutoScroll() {
    dragClientYRef.current = null;
    scrollContainerRef.current = null;

    if (autoScrollFrameRef.current !== null) {
      window.cancelAnimationFrame(autoScrollFrameRef.current);
      autoScrollFrameRef.current = null;
    }
  }

  function runAutoScroll() {
    if (dragClientYRef.current === null) {
      autoScrollFrameRef.current = null;
      return;
    }

    const scrollContainer = scrollContainerRef.current;
    const clientY = dragClientYRef.current;
    const top = scrollContainer?.getBoundingClientRect().top ?? 0;
    const bottom =
      scrollContainer?.getBoundingClientRect().bottom ?? window.innerHeight;
    const step = getAutoScrollStep(clientY, top, bottom);

    if (step !== 0) {
      if (scrollContainer) {
        scrollContainer.scrollBy({ top: step });
      } else {
        window.scrollBy({ top: step });
      }
    }

    autoScrollFrameRef.current = window.requestAnimationFrame(runAutoScroll);
  }

  function ensureAutoScrollStarted() {
    if (autoScrollFrameRef.current !== null) {
      return;
    }

    autoScrollFrameRef.current = window.requestAnimationFrame(runAutoScroll);
  }

  const habitSections = HABIT_FREQUENCY_SECTIONS.map((section) => ({
    ...section,
    habits: habits.filter((habit) => habit.frequency === section.frequency),
  })).filter(
    (section) =>
      section.habits.length > 0 ||
      recentArchivedHabit?.frequency === section.frequency
  );

  return (
    <div
      ref={listRef}
      className="grid gap-3"
      onDragEnd={stopAutoScroll}
      onDragLeave={(event) => {
        const { relatedTarget } = event;

        if (
          relatedTarget instanceof Node &&
          event.currentTarget.contains(relatedTarget)
        ) {
          return;
        }

        stopAutoScroll();
      }}
      onDragOverCapture={(event) => {
        if (!dragState) {
          stopAutoScroll();
          return;
        }

        dragClientYRef.current = event.clientY;
        scrollContainerRef.current = findScrollableAncestor(listRef.current);
        ensureAutoScrollStarted();
      }}
      onDrop={stopAutoScroll}
    >
      <LayoutGroup>
        <div className="grid gap-4">
          {habitSections.map((section) => (
            <section
              className="grid gap-2"
              key={section.frequency}
              aria-label={`${section.title} habits`}
            >
              <div className="flex items-baseline justify-between gap-3 px-1">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    {section.title}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {section.habits.length}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {section.description}
                </p>
              </div>
              <AnimatePresence initial={false}>
                {section.habits.map((habit, index) => (
                  <HabitManagementListItem
                    key={habit.id}
                    dragState={dragState}
                    expandedHabitId={expandedHabitId}
                    habit={habit}
                    index={index}
                    onArchiveHabit={onArchiveHabit}
                    onDragStateChange={onDragStateChange}
                    onDrop={onDrop}
                    onExpandedHabitChange={onExpandedHabitChange}
                    onRenameHabit={onRenameHabit}
                    onReorderHabits={onReorderHabits}
                    onUndoArchive={onUndoArchive}
                    onUpdateHabitCategory={onUpdateHabitCategory}
                    onUpdateHabitFrequency={onUpdateHabitFrequency}
                    onUpdateHabitTargetCount={onUpdateHabitTargetCount}
                    onUpdateHabitWeekdays={onUpdateHabitWeekdays}
                    recentArchivedHabit={
                      recentArchivedHabit?.frequency === section.frequency &&
                      recentArchivedHabit.index === index
                        ? recentArchivedHabit
                        : null
                    }
                    sectionHabits={section.habits}
                  />
                ))}
                {recentArchivedHabit?.frequency === section.frequency &&
                recentArchivedHabit.index >= section.habits.length ? (
                  <HabitManagementListItem
                    key={`recent-archived-${recentArchivedHabit.habitId}`}
                    dragState={dragState}
                    expandedHabitId={expandedHabitId}
                    habit={section.habits[0] ?? null}
                    index={recentArchivedHabit.index}
                    onArchiveHabit={onArchiveHabit}
                    onDragStateChange={onDragStateChange}
                    onDrop={onDrop}
                    onExpandedHabitChange={onExpandedHabitChange}
                    onRenameHabit={onRenameHabit}
                    onReorderHabits={onReorderHabits}
                    onUndoArchive={onUndoArchive}
                    onUpdateHabitCategory={onUpdateHabitCategory}
                    onUpdateHabitFrequency={onUpdateHabitFrequency}
                    onUpdateHabitTargetCount={onUpdateHabitTargetCount}
                    onUpdateHabitWeekdays={onUpdateHabitWeekdays}
                    recentArchivedHabit={recentArchivedHabit}
                    sectionHabits={section.habits}
                  />
                ) : null}
              </AnimatePresence>
            </section>
          ))}
        </div>
      </LayoutGroup>
    </div>
  );
}
