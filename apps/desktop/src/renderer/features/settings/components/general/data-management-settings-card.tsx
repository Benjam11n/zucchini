import {
  AlertTriangle,
  Download,
  FolderOpen,
  HardDriveDownload,
  Upload,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/renderer/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/renderer/shared/ui/dialog";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
} from "@/renderer/shared/ui/item";

type DataAction = "export" | "import" | "open" | null;

function getPathLabel(filePath: string): string {
  return filePath.split(/[/\\]/).at(-1) ?? filePath;
}

export function DataManagementSettingsCard() {
  const [activeAction, setActiveAction] = useState<DataAction>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
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
        <CardHeader>
          <CardDescription>Data safety</CardDescription>
          <div className="flex items-center gap-2">
            <HardDriveDownload className="size-4 text-primary" />
            <CardTitle>Backups & data</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <ItemGroup className="gap-0">
            <Item className="py-2">
              <ItemContent>
                <p className="text-sm font-medium">Open data folder</p>
                <ItemDescription className="text-xs leading-snug">
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
                <ItemDescription className="text-xs leading-snug">
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
                <ItemDescription className="text-xs leading-snug">
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

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import backup</DialogTitle>
            <DialogDescription>
              Choose a backup file to replace your current local data. Zucchini
              will restart immediately after a successful import.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4">
            <div
              className="flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/8 p-4 text-sm text-destructive"
              role="alert"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div className="space-y-1">
                <p className="font-medium">
                  This replaces your current local data.
                </p>
                <p className="leading-snug text-destructive/85">
                  Importing a backup overwrites the current `zucchini.db` on
                  this device.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => {
                setIsImportDialogOpen(false);
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={activeAction !== null}
              onClick={async () => {
                await runAction("import", async () => {
                  setIsImportDialogOpen(false);
                  const didImport = await window.habits.importBackup();

                  if (didImport) {
                    setFeedbackMessage("Restarting Zucchini with your backup.");
                  }
                });
              }}
            >
              Import and restart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
