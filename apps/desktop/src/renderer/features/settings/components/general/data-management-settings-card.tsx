import {
  Download,
  FileSpreadsheet,
  FolderOpen,
  HardDriveDownload,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { SettingsCardHeader } from "@/renderer/features/settings/components/settings-card-header";
import { getPathLabel } from "@/renderer/features/settings/lib/data-management-format";
import { Card, CardContent } from "@/renderer/shared/components/ui/card";
import { ItemGroup } from "@/renderer/shared/components/ui/item";
import { clearZucchiniStorage } from "@/renderer/shared/lib/storage";
import type { BackupRestorePreview } from "@/shared/contracts/api/desktop-api";
import type { AppSettings } from "@/shared/domain/settings";

import { AutoBackupSettingsSection } from "./auto-backup-settings-section";
import { DataActionItem } from "./data-action-item";
import { DestructiveDataDialog } from "./destructive-data-dialog";
import { RestoreBackupDialog } from "./restore-backup-dialog";
import type { DataAction } from "./restore-backup-dialog";

interface DataManagementSettingsCardProps {
  onChange: (settings: AppSettings) => void;
  settings: AppSettings;
}

export function DataManagementSettingsCard({
  onChange,
  settings,
}: DataManagementSettingsCardProps) {
  const [activeAction, setActiveAction] = useState<DataAction>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isClearDataDialogOpen, setIsClearDataDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasNoAutoBackup, setHasNoAutoBackup] = useState(false);
  const [restorePreview, setRestorePreview] =
    useState<BackupRestorePreview | null>(null);

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

  function openRestoreDialog(preview: BackupRestorePreview) {
    setRestorePreview(preview);
    setIsRestoreDialogOpen(true);
  }

  function closeRestoreDialog(open: boolean) {
    setIsRestoreDialogOpen(open);

    if (!open) {
      setRestorePreview(null);
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
          <AutoBackupSettingsSection
            onChange={onChange}
            onErrorMessage={setErrorMessage}
            onFeedbackMessage={setFeedbackMessage}
            settings={settings}
          />

          <ItemGroup className="gap-0">
            <DataActionItem
              description="Reveal the local folder that stores your database and app state."
              disabled={activeAction !== null}
              icon={FolderOpen}
              label="Open folder"
              onClick={async () => {
                await runAction("open", async () => {
                  const openedPath = await window.desktop.openDataFolder();
                  setFeedbackMessage(
                    `Opened ${getPathLabel(openedPath)} in your file manager.`
                  );
                });
              }}
            />

            <DataActionItem
              description="Save a copy of your current `zucchini.db` to a location you choose."
              disabled={activeAction !== null}
              icon={Download}
              label="Export backup"
              onClick={async () => {
                await runAction("export", async () => {
                  const exportedPath = await window.desktop.exportBackup();

                  if (exportedPath === null) {
                    return;
                  }

                  setFeedbackMessage(
                    `Backup exported as ${getPathLabel(exportedPath)}.`
                  );
                });
              }}
            />

            <DataActionItem
              description="Save readable CSV files for every Zucchini data table."
              disabled={activeAction !== null}
              icon={FileSpreadsheet}
              label="Export CSV"
              onClick={async () => {
                await runAction("exportCsv", async () => {
                  const exportedPath = await window.desktop.exportCsvData();

                  if (exportedPath === null) {
                    return;
                  }

                  setFeedbackMessage(
                    `CSV export saved in ${getPathLabel(exportedPath)}.`
                  );
                });
              }}
            />

            <DataActionItem
              description="Preview and restore the latest scheduled backup."
              disabled={activeAction !== null}
              icon={RotateCcw}
              label="Restore latest"
              onClick={async () => {
                await runAction("chooseRestore", async () => {
                  const preview =
                    await window.desktop.getLatestAutoBackupRestorePreview();
                  setHasNoAutoBackup(preview === null);

                  if (!preview) {
                    setFeedbackMessage("No auto backup yet.");
                    return;
                  }

                  openRestoreDialog(preview);
                });
              }}
            />

            {hasNoAutoBackup ? (
              <div className="px-4 pb-2 text-xs text-muted-foreground">
                No auto backup yet.
              </div>
            ) : null}

            <DataActionItem
              description="Choose any Zucchini backup file, preview it, then restore."
              disabled={activeAction !== null}
              icon={RotateCcw}
              label="Choose backup"
              onClick={async () => {
                await runAction("chooseRestore", async () => {
                  const preview = await window.desktop.chooseBackupForRestore();

                  if (!preview) {
                    return;
                  }

                  openRestoreDialog(preview);
                });
              }}
            />

            <DataActionItem
              description="Delete this device's local Zucchini data and restart with a fresh database."
              disabled={activeAction !== null}
              icon={Trash2}
              label="Clear data"
              onClick={() => {
                setIsClearDataDialogOpen(true);
              }}
              variant="destructive"
            />
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

      <RestoreBackupDialog
        activeAction={activeAction}
        onOpenChange={closeRestoreDialog}
        onRestore={async () => {
          if (!restorePreview) {
            return;
          }

          const { restoreId } = restorePreview;

          await runAction("restore", async () => {
            closeRestoreDialog(false);
            const didRestore = await window.desktop.restoreBackup(restoreId);

            if (didRestore) {
              setFeedbackMessage("Restarting Zucchini with your backup.");
            }
          });
        }}
        open={isRestoreDialogOpen}
        preview={restorePreview}
      />

      <DestructiveDataDialog
        actionLabel="Clear data and restart"
        description="Delete all local Zucchini data on this device and restart with a clean database."
        disabled={activeAction !== null}
        onAction={async () => {
          await runAction("clear", async () => {
            clearZucchiniStorage();
            setIsClearDataDialogOpen(false);
            const didClear = await window.desktop.clearData();

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
