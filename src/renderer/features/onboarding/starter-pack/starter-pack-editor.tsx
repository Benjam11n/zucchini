import { Trash2 } from "lucide-react";

import { Button } from "@/renderer/shared/ui/button";
import { Input } from "@/renderer/shared/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
} from "@/renderer/shared/ui/item";

import {
  HabitCategorySelector,
  HabitFrequencySelector,
} from "../../settings/habit-settings/habit-category-selector";
import type {
  EditableStarterPackHabitDraft,
  StarterPackEditorProps,
} from "../types";
import {
  removeStarterPackHabitDraft,
  updateStarterPackHabitDraft,
} from "../utils";

function StarterPackHabitRow({
  draft,
  index,
  onChange,
  onRemove,
}: {
  draft: EditableStarterPackHabitDraft;
  index: number;
  onChange: (index: number, nextDraft: EditableStarterPackHabitDraft) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <Item
      className="grid gap-3 border border-border/60 bg-card/70 p-4"
      variant="outline"
    >
      <div className="flex items-start justify-between gap-3">
        <ItemContent>
          <p className="text-sm font-semibold text-foreground">
            Habit {index + 1}
          </p>
          <ItemDescription>
            Tweak the starter pack before it gets added to your dashboard.
          </ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button
            aria-label={`Remove ${draft.name}`}
            size="icon-sm"
            type="button"
            variant="ghost"
            onClick={() => onRemove(index)}
          >
            <Trash2 className="size-4" />
          </Button>
        </ItemActions>
      </div>

      <Input
        onChange={(event) =>
          onChange(index, {
            ...draft,
            name: event.target.value,
          })
        }
        placeholder="Habit name"
        type="text"
        value={draft.name}
      />
      <HabitCategorySelector
        name={`starter-pack-category-${index}`}
        onChange={(category) =>
          onChange(index, {
            ...draft,
            category,
          })
        }
        selectedCategory={draft.category}
      />
      <HabitFrequencySelector
        name={`starter-pack-frequency-${index}`}
        onChange={(frequency) =>
          onChange(index, {
            ...draft,
            frequency,
          })
        }
        selectedFrequency={draft.frequency}
      />
    </Item>
  );
}

export function StarterPackEditor({
  drafts,
  onChange,
}: StarterPackEditorProps) {
  return (
    <ItemGroup>
      {drafts.map((draft, index) => (
        <StarterPackHabitRow
          key={draft.draftId}
          draft={draft}
          index={index}
          onChange={(draftIndex, nextDraft) =>
            onChange(updateStarterPackHabitDraft(drafts, draftIndex, nextDraft))
          }
          onRemove={(draftIndex) =>
            onChange(removeStarterPackHabitDraft(drafts, draftIndex))
          }
        />
      ))}
    </ItemGroup>
  );
}
