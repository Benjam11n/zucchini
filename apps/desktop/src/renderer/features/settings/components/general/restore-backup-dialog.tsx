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
import type { BackupRestorePreview } from "@/shared/contracts/api/desktop-api";

import {
  formatBackupDate,
  formatBackupSize,
} from "../../lib/data-management-format";
import { RestoreHabitSnapshot } from "./restore-habit-snapshot";

export type DataAction =
  | "chooseRestore"
  | "clear"
  | "export"
  | "exportCsv"
  | "open"
  | "restore"
  | null;

interface RestoreBackupDialogProps {
  activeAction: DataAction;
  onOpenChange: (open: boolean) => void;
  onRestore: () => Promise<void>;
  open: boolean;
  preview: BackupRestorePreview | null;
}

export function RestoreBackupDialog({
  activeAction,
  onOpenChange,
  onRestore,
  open,
  preview,
}: RestoreBackupDialogProps) {
  const canRestore = activeAction !== "restore";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-hidden">
        <DialogHeader className="gap-1 pt-5">
          <DialogTitle>Restore backup</DialogTitle>
          <DialogDescription>
            Review this backup before replacing current local data.
          </DialogDescription>
        </DialogHeader>

        {preview ? (
          <div className="grid max-h-[calc(88vh-9rem)] gap-3 overflow-y-auto px-5 py-4">
            <div className="rounded-xl border border-border/70 bg-muted/25 p-3">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{preview.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {preview.source === "auto" ? "Auto backup" : "Chosen file"}
                  </p>
                </div>
                <span className="rounded-md border border-border/70 px-2 py-1 text-xs text-muted-foreground">
                  {formatBackupSize(preview.sizeBytes)}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Modified</dt>
                  <dd>{formatBackupDate(preview.modifiedAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Latest activity
                  </dt>
                  <dd>{preview.latestActivityDate ?? "None"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Habits</dt>
                  <dd>{preview.habitCount}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    Focus sessions
                  </dt>
                  <dd>{preview.focusSessionCount}</dd>
                </div>
              </dl>
            </div>

            <RestoreHabitSnapshot preview={preview} />

            <div
              className="flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/8 p-3 text-sm text-destructive"
              role="alert"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div className="space-y-1">
                <p className="font-medium">This replaces current local data.</p>
                <p className="leading-snug text-destructive/85">
                  Zucchini will create a restore point, replace your local
                  database, then restart.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <DialogFooter className="px-5 pb-5">
          <Button
            onClick={() => {
              onOpenChange(false);
            }}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={!canRestore}
            onClick={() => {
              void onRestore();
            }}
          >
            Restore and restart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
