import { Archive, Pencil } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

import { toChecklistHabit } from "@/renderer/features/wind-down/lib/wind-down-action-adapters";
import { Button } from "@/renderer/shared/components/ui/button";
import { ConfirmIconButton } from "@/renderer/shared/components/ui/confirm-icon-button";
import {
  HabitListEmptyState,
  HabitListItem,
  HabitListItemActions,
  HabitListRows,
} from "@/renderer/shared/components/ui/habit-list";
import { Input } from "@/renderer/shared/components/ui/input";
import type { WindDownActionWithStatus } from "@/shared/domain/wind-down";

interface WindDownActionRowsProps {
  actions: WindDownActionWithStatus[];
  onDeleteAction: (actionId: number) => Promise<boolean>;
  onRenameAction: (actionId: number, name: string) => Promise<boolean>;
  onToggleAction: (actionId: number) => void;
}

export function WindDownActionRows({
  actions,
  onDeleteAction,
  onRenameAction,
  onToggleAction,
}: WindDownActionRowsProps) {
  const [editingActionId, setEditingActionId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const activeEditingInput = useRef<HTMLInputElement | null>(null);
  const handleEditingInputRef = useCallback((node: HTMLInputElement | null) => {
    if (!node || node === activeEditingInput.current) {
      return;
    }

    activeEditingInput.current = node;
    node.focus();
    node.select();
  }, []);
  const windDownChecklistHabits = useMemo(
    () => actions.map(toChecklistHabit),
    [actions]
  );

  const commitRenameAction = async (actionId: number) => {
    const name = editingName.trim();

    setEditingActionId(null);
    if (!name) {
      return;
    }

    const didRename = await onRenameAction(actionId, name);

    if (!didRename) {
      setEditingActionId(actionId);
    }
  };

  if (windDownChecklistHabits.length === 0) {
    return <HabitListEmptyState>No wind down actions yet.</HabitListEmptyState>;
  }

  return (
    <HabitListRows>
      {windDownChecklistHabits.map((action) => {
        const isEditing = editingActionId === action.id;

        return isEditing ? (
          <div key={action.id} className="rounded-md px-3 py-2.5">
            <Input
              onBlur={() => void commitRenameAction(action.id)}
              onChange={(event) => setEditingName(event.currentTarget.value)}
              onKeyDown={async (event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  await commitRenameAction(action.id);
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
              <HabitListItemActions>
                <Button
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setEditingActionId(action.id);
                    setEditingName(action.name);
                  }}
                  size="icon-xs"
                  type="button"
                  variant="ghost"
                >
                  <Pencil className="size-3.5" />
                  <span className="sr-only">Edit {action.name}</span>
                </Button>
                <ConfirmIconButton
                  confirmLabel={`Confirm delete ${action.name}`}
                  icon={<Archive className="size-3.5" />}
                  idleLabel={`Delete ${action.name}`}
                  onConfirm={async () => {
                    await onDeleteAction(action.id);
                  }}
                  resetKey={action.id}
                  size="icon-xs"
                  variant="destructive"
                />
              </HabitListItemActions>
            }
          />
        );
      })}
    </HabitListRows>
  );
}
