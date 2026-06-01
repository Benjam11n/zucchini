import { AlertTriangle } from "lucide-react";

import { Button } from "@/renderer/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/renderer/shared/components/ui/dialog";

interface DestructiveDataDialogProps {
  actionLabel: string;
  description: string;
  disabled: boolean;
  onAction: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
  warningBody: string;
  warningTitle: string;
  variant?: "default" | "destructive";
}

export function DestructiveDataDialog({
  actionLabel,
  description,
  disabled,
  onAction,
  onOpenChange,
  open,
  title,
  warningBody,
  warningTitle,
  variant = "default",
}: DestructiveDataDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 p-6">
          <div
            className="flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/8 p-4 text-sm text-destructive"
            role="alert"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div className="space-y-1">
              <p className="font-medium">{warningTitle}</p>
              <p className="leading-snug text-destructive/85">{warningBody}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => {
              onOpenChange(false);
            }}
            variant="outline"
          >
            Cancel
          </Button>
          <Button disabled={disabled} onClick={onAction} variant={variant}>
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
