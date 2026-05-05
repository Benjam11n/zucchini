import {
  AlertTriangle,
  Download,
  FolderOpen,
  HardDriveDownload,
  Trash2,
  Upload,
} from "lucide-react";
import { useState } from "react";

import { SettingsCardHeader } from "@/renderer/features/settings/components/settings-card-header";
import { Button } from "@/renderer/shared/components/ui/button";
import { Card, CardContent } from "@/renderer/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/renderer/shared/components/ui/dialog";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
} from "@/renderer/shared/components/ui/item";
import { clearZucchiniStorage } from "@/renderer/shared/lib/storage";

type DataAction = "clear" | "export" | "import" | "open" | null;

function getPathLabel(filePath: string): string {
  return filePath.split(/[/\\]/).at(-1) ?? filePath;
}

function DestructiveDataDialog({
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
}: {
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
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 px-6 py-6">
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

export function DataManagementSettingsCard() {
  const [activeAction, setActiveAction] = useState<DataAction>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isClearDataDialogOpen, setIsClearDataDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function runAction(
    action: Exclude<DataAction, null>,
    execute: () => Promise<void>
  ): Promise<void> {
    setActiveAction(action);
    setErrorMessage(null);

    try {
      await execute();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Zucchini could not finish the data action."
      );
    } finally {
      setActiveAction(null);
    }
  }

  return (
    <>
      <Card>
        <SettingsCardHeader
          description="Open local app data or move your data with backups."
          icon={HardDriveDownload}
          title="Backups & data"
        />
        <CardContent className="space-y-3">
          <ItemGroup className="gap-0">
            <Item className="py-2">
              <ItemContent>
                <p className="text-sm font-medium">Open data folder</p>
                <ItemDescription>
                  Reveal the local folder that stores your database and app
                  state.
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  disabled={activeAction !== null}
                  onClick={async () => {
                    await runAction("open", async () => {
                      const openedPath = await window.habits.openDataFolder();
                      setFeedbackMessage(
                        `Opened ${getPathLabel(openedPath)} in your file manager.`
                      );
                    });
                  }}
                  size="sm"
                  variant="outline"
                >
                  <FolderOpen className="size-4" />
                  Open folder
                </Button>
              </ItemActions>
            </Item>

            <Item className="py-2">
              <ItemContent>
                <p className="text-sm font-medium">Export backup</p>
                <ItemDescription>
                  Save a copy of your current `zucchini.db` to a location you
                  choose.
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  disabled={activeAction !== null}
                  onClick={async () => {
                    await runAction("export", async () => {
                      const exportedPath = await window.habits.exportBackup();

                      if (exportedPath === null) {
                        return;
                      }

                      setFeedbackMessage(
                        `Backup exported as ${getPathLabel(exportedPath)}.`
                      );
                    });
                  }}
                  size="sm"
                  variant="outline"
                >
                  <Download className="size-4" />
                  Export backup
                </Button>
              </ItemActions>
            </Item>

            <Item className="py-2">
              <ItemContent>
                <p className="text-sm font-medium">Import backup</p>
                <ItemDescription>
                  Restore from a backup file. Zucchini will restart after the
                  import finishes.
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  disabled={activeAction !== null}
                  onClick={() => {
                    setIsImportDialogOpen(true);
                  }}
                  size="sm"
                  variant="outline"
                >
                  <Upload className="size-4" />
                  Import backup
                </Button>
              </ItemActions>
            </Item>

            <Item className="py-2">
              <ItemContent>
                <p className="text-sm font-medium">Clear local data</p>
                <ItemDescription>
                  Delete this device&apos;s local Zucchini data and restart with
                  a fresh database.
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  disabled={activeAction !== null}
                  onClick={() => {
                    setIsClearDataDialogOpen(true);
                  }}
                  size="sm"
                  variant="destructive"
                >
                  <Trash2 className="size-4" />
                  Clear data
                </Button>
              </ItemActions>
            </Item>
          </ItemGroup>

          {errorMessage ? (
            <div className="rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          {feedbackMessage ? (
            <div className="rounded-xl border border-border/60 bg-muted/25 px-4 py-3 text-sm text-muted-foreground">
              {feedbackMessage}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <DestructiveDataDialog
        actionLabel="Import and restart"
        description="Choose a backup file to replace your current local data. Zucchini will restart immediately after a successful import."
        disabled={activeAction !== null}
        onAction={async () => {
          await runAction("import", async () => {
            setIsImportDialogOpen(false);
            const didImport = await window.habits.importBackup();

            if (didImport) {
              setFeedbackMessage("Restarting Zucchini with your backup.");
            }
          });
        }}
        open={isImportDialogOpen}
        title="Import backup"
        warningBody="Importing a backup overwrites the current `zucchini.db` on this device."
        warningTitle="This replaces your current local data."
        onOpenChange={setIsImportDialogOpen}
      />

      <DestructiveDataDialog
        actionLabel="Clear data and restart"
        description="Delete all local Zucchini data on this device and restart with a clean database."
        disabled={activeAction !== null}
        onAction={async () => {
          await runAction("clear", async () => {
            clearZucchiniStorage();
            setIsClearDataDialogOpen(false);
            const didClear = await window.habits.clearData();

            if (didClear) {
              setFeedbackMessage(
                "Restarting Zucchini with a fresh local database."
              );
            }
          });
        }}
        open={isClearDataDialogOpen}
        title="Clear local data"
        variant="destructive"
        warningBody="Your habits, history, focus sessions, and settings on this device will be removed. Export a backup first if you may need them later."
        warningTitle="This permanently deletes local data."
        onOpenChange={setIsClearDataDialogOpen}
      />
    </>
  );
}
