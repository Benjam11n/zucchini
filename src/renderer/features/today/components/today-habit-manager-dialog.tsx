import { Settings2 } from "lucide-react";
import { useState } from "react";

import { HabitManagementContent } from "@/renderer/features/settings/components/habits/habit-management-content";
import type { HabitManagementCardProps } from "@/renderer/features/settings/settings.types";
import { Button } from "@/renderer/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/renderer/shared/ui/dialog";

export function TodayHabitManagerDialog(props: HabitManagementCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        className="rounded-full"
        onClick={() => {
          setIsOpen(true);
        }}
        size="sm"
        type="button"
        variant="outline"
      >
        <Settings2 className="size-4" />
        Manage
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage habits</DialogTitle>
            <DialogDescription className="pb-2">
              Add new habits and adjust names, categories, frequencies, or
              ordering without leaving today&apos;s flow.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 px-6 pb-6">
            <HabitManagementContent {...props} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
