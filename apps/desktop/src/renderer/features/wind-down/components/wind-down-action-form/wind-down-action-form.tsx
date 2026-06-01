import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/renderer/shared/components/ui/button";
import { Input } from "@/renderer/shared/components/ui/input";

interface WindDownActionFormProps {
  onCreateAction: (name: string) => Promise<boolean>;
}

export function WindDownActionForm({
  onCreateAction,
}: WindDownActionFormProps) {
  const [newActionName, setNewActionName] = useState("");
  const [isCreatingAction, setIsCreatingAction] = useState(false);

  const handleCreateAction = async () => {
    const name = newActionName.trim();
    if (!name || isCreatingAction) {
      return;
    }

    setIsCreatingAction(true);
    const didCreate = await onCreateAction(name);

    if (didCreate) {
      setNewActionName("");
    }

    setIsCreatingAction(false);
  };

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row"
      onSubmit={async (event) => {
        event.preventDefault();
        await handleCreateAction();
      }}
    >
      <Input
        onChange={(event) => {
          setNewActionName(event.currentTarget.value);
        }}
        placeholder="Read a book..."
        value={newActionName}
      />
      <Button
        disabled={isCreatingAction || newActionName.trim().length === 0}
        type="submit"
      >
        <Plus className="size-4" />
        Add action
      </Button>
    </form>
  );
}
