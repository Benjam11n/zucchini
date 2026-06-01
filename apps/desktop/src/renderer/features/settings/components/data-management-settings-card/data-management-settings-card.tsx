import {
  Download,
  FileSpreadsheet,
  FolderOpen,
  HardDriveDownload,
  RotateCcw,
  Trash2,
} from "lucide-react";

import { SettingsCardHeader } from "@/renderer/features/settings/components/settings-card-header";
import { Card, CardContent } from "@/renderer/shared/components/ui/card";
import { ItemGroup } from "@/renderer/shared/components/ui/item";
import type { AppSettings } from "@/shared/domain/settings";

import type { SettingsPageActions } from "../../settings.types";
import { AutoBackupSettingsSection } from "../auto-backup-settings-section";
import { DataActionItem } from "../data-action-item";
import { DestructiveDataDialog } from "../destructive-data-dialog";
import { RestoreBackupDialog } from "../restore-backup-dialog";
import { useDataManagementController } from "./use-data-management-controller";

interface DataManagementSettingsCardProps {
  actions: SettingsPageActions["dataManagement"];
  onChange: (settings: AppSettings) => void;
  settings: AppSettings;
}

export function DataManagementSettingsCard({
  actions,
  onChange,
  settings,
}: DataManagementSettingsCardProps) {
  const controller = useDataManagementController({ actions });
  const isActionRunning = controller.activeAction !== null;

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
            activeAction={controller.activeAutoBackupAction}
            onChange={onChange}
            onOpenAutoBackupFolder={controller.handleOpenAutoBackupFolder}
            settings={settings}
          />

          <ItemGroup className="gap-0">
            <DataActionItem
              description="Reveal the local folder that stores your database and app state."
              disabled={isActionRunning}
              icon={FolderOpen}
              label="Open folder"
              onClick={controller.handleOpenDataFolder}
            />

            <DataActionItem
              description="Save a copy of your current `zucchini.db` to a location you choose."
              disabled={isActionRunning}
              icon={Download}
              label="Export backup"
              onClick={controller.handleExportBackup}
            />

            <DataActionItem
              description="Save readable CSV files for every Zucchini data table."
              disabled={isActionRunning}
              icon={FileSpreadsheet}
              label="Export CSV"
              onClick={controller.handleExportCsvData}
            />

            <DataActionItem
              description="Preview and restore the latest scheduled backup."
              disabled={isActionRunning}
              icon={RotateCcw}
              label="Restore latest"
              onClick={controller.handleGetLatestAutoBackupRestorePreview}
            />

            {controller.hasNoAutoBackup ? (
              <div className="px-4 pb-2 text-xs text-muted-foreground">
                No auto backup yet.
              </div>
            ) : null}

            <DataActionItem
              description="Choose any Zucchini backup file, preview it, then restore."
              disabled={isActionRunning}
              icon={RotateCcw}
              label="Choose backup"
              onClick={controller.handleChooseBackupForRestore}
            />

            <DataActionItem
              description="Delete this device's local Zucchini data and restart with a fresh database."
              disabled={isActionRunning}
              icon={Trash2}
              label="Clear data"
              onClick={() => {
                controller.setIsClearDataDialogOpen(true);
              }}
              variant="destructive"
            />
          </ItemGroup>

          {controller.errorMessage ? (
            <div className="rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
              {controller.errorMessage}
            </div>
          ) : null}

          {controller.feedbackMessage ? (
            <div className="rounded-xl border border-border/60 bg-muted/25 px-4 py-3 text-sm text-muted-foreground">
              {controller.feedbackMessage}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <RestoreBackupDialog
        activeAction={controller.activeAction}
        onOpenChange={controller.closeRestoreDialog}
        onRestore={controller.handleRestoreBackup}
        open={controller.isRestoreDialogOpen}
        preview={controller.restorePreview}
      />

      <DestructiveDataDialog
        actionLabel="Clear data and restart"
        description="Delete all local Zucchini data on this device and restart with a clean database."
        disabled={isActionRunning}
        onAction={controller.handleClearData}
        open={controller.isClearDataDialogOpen}
        title="Clear local data"
        variant="destructive"
        warningBody="Your habits, history, focus sessions, and settings on this device will be removed. Export a backup first if you may need them later."
        warningTitle="This permanently deletes local data."
        onOpenChange={controller.setIsClearDataDialogOpen}
      />
    </>
  );
}
