import { Wand2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  StarterPackHabitDraft,
  StarterPackId,
} from "@/shared/domain/onboarding";

import { StarterPackEditor } from "../onboarding/starter-pack-editor";
import { StarterPackPicker } from "../onboarding/starter-pack-picker";
import type { EditableStarterPackHabitDraft } from "../onboarding/types";
import {
  createStarterPackDrafts,
  hasStarterPackHabits,
  toStarterPackHabits,
} from "../onboarding/utils";

interface StarterPacksCardProps {
  onApplyStarterPack: (habits: StarterPackHabitDraft[]) => Promise<void>;
}

export function StarterPacksCard({
  onApplyStarterPack,
}: StarterPacksCardProps) {
  const [selectedStarterPack, setSelectedStarterPack] =
    useState<StarterPackId>("morning-routine");
  const [drafts, setDrafts] = useState<EditableStarterPackHabitDraft[]>(() =>
    createStarterPackDrafts("morning-routine")
  );
  const [isApplying, setIsApplying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setDrafts(createStarterPackDrafts(selectedStarterPack));
    setStatusMessage(null);
    setErrorMessage(null);
  }, [selectedStarterPack]);

  async function handleApply(): Promise<void> {
    setIsApplying(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await onApplyStarterPack(toStarterPackHabits(drafts));
      setStatusMessage("Starter pack added to your habits.");
    } catch {
      setErrorMessage("Could not apply that starter pack right now.");
    } finally {
      setIsApplying(false);
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
              setSelectedStarterPack(choice);
            }
          }}
          selectedChoice={selectedStarterPack}
        />
        <StarterPackEditor drafts={drafts} onChange={setDrafts} />

        {statusMessage ? (
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            {statusMessage}
          </p>
        ) : null}
        {errorMessage ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              setDrafts(createStarterPackDrafts(selectedStarterPack))
            }
          >
            Reset pack
          </Button>
          <Button
            disabled={isApplying || !hasStarterPackHabits(drafts)}
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
