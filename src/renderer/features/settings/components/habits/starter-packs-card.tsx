import { Wand2 } from "lucide-react";
import { useReducer } from "react";

import { StarterPackEditor } from "@/renderer/features/starter-packs/components/starter-pack-editor";
import { StarterPackPicker } from "@/renderer/features/starter-packs/components/starter-pack-picker";
import {
  createStarterPackDrafts,
  hasStarterPackHabits,
  toStarterPackHabits,
} from "@/renderer/features/starter-packs/lib/starter-pack-drafts";
import type { EditableStarterPackHabitDraft } from "@/renderer/features/starter-packs/starter-packs.types";
import { Button } from "@/renderer/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/ui/card";
import type {
  StarterPackHabitDraft,
  StarterPackId,
} from "@/shared/domain/onboarding";

interface StarterPacksCardProps {
  onApplyStarterPack: (habits: StarterPackHabitDraft[]) => Promise<void>;
}

interface StarterPacksCardState {
  drafts: EditableStarterPackHabitDraft[];
  errorMessage: string | null;
  isApplying: boolean;
  selectedStarterPack: StarterPackId;
  statusMessage: string | null;
}

type StarterPacksCardAction =
  | { type: "applyFailed" }
  | { type: "applyStarted" }
  | { type: "applySucceeded" }
  | { type: "resetDrafts" }
  | { selectedStarterPack: StarterPackId; type: "selectStarterPack" }
  | { drafts: EditableStarterPackHabitDraft[]; type: "setDrafts" };

const INITIAL_STARTER_PACK_ID: StarterPackId = "morning-routine";

function createStarterPacksCardState(
  selectedStarterPack: StarterPackId = INITIAL_STARTER_PACK_ID
): StarterPacksCardState {
  return {
    drafts: createStarterPackDrafts(selectedStarterPack),
    errorMessage: null,
    isApplying: false,
    selectedStarterPack,
    statusMessage: null,
  };
}

function starterPacksCardReducer(
  state: StarterPacksCardState,
  action: StarterPacksCardAction
): StarterPacksCardState {
  switch (action.type) {
    case "applyFailed": {
      return {
        ...state,
        errorMessage: "Could not apply that starter pack right now.",
        isApplying: false,
        statusMessage: null,
      };
    }
    case "applyStarted": {
      return {
        ...state,
        errorMessage: null,
        isApplying: true,
        statusMessage: null,
      };
    }
    case "applySucceeded": {
      return {
        ...state,
        errorMessage: null,
        isApplying: false,
        statusMessage: "Starter pack added to your habits.",
      };
    }
    case "resetDrafts": {
      return {
        ...state,
        drafts: createStarterPackDrafts(state.selectedStarterPack),
      };
    }
    case "selectStarterPack": {
      return createStarterPacksCardState(action.selectedStarterPack);
    }
    case "setDrafts": {
      return {
        ...state,
        drafts: action.drafts,
      };
    }
    default: {
      return state;
    }
  }
}

export function StarterPacksCard({
  onApplyStarterPack,
}: StarterPacksCardProps) {
  const [state, dispatch] = useReducer(
    starterPacksCardReducer,
    INITIAL_STARTER_PACK_ID,
    createStarterPacksCardState
  );

  async function handleApply(): Promise<void> {
    dispatch({ type: "applyStarted" });

    try {
      await onApplyStarterPack(toStarterPackHabits(state.drafts));
      dispatch({ type: "applySucceeded" });
    } catch {
      dispatch({ type: "applyFailed" });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardDescription>Starter packs</CardDescription>
        <div className="flex items-center gap-2">
          <Wand2 className="size-4 text-primary" />
          <CardTitle>Bootstrap a new system</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <StarterPackPicker
          onSelectChoice={(choice) => {
            if (choice !== "blank") {
              dispatch({
                selectedStarterPack: choice,
                type: "selectStarterPack",
              });
            }
          }}
          selectedChoice={state.selectedStarterPack}
        />
        <StarterPackEditor
          drafts={state.drafts}
          onChange={(drafts) => {
            dispatch({ drafts, type: "setDrafts" });
          }}
        />

        {state.statusMessage ? (
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            {state.statusMessage}
          </p>
        ) : null}
        {state.errorMessage ? (
          <p className="text-sm text-destructive">{state.errorMessage}</p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              dispatch({ type: "resetDrafts" });
            }}
          >
            Reset pack
          </Button>
          <Button
            disabled={state.isApplying || !hasStarterPackHabits(state.drafts)}
            type="button"
            onClick={() => {
              void handleApply();
            }}
          >
            Apply starter pack
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
