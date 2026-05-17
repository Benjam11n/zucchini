import {
  AlertTriangle,
  Download,
  FileSpreadsheet,
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
import type { AppSettings, AutoBackupCadence } from "@/shared/domain/settings";

type DataAction = "clear" | "export" | "exportCsv" | "import" | "open" | null;
type AutoBackupAction = "openAutoFolder";

function getPathLabel(filePath: string): string {
  return filePath.split(/[/\\]/).at(-1) ?? filePath;
}

function DataActionItem({
  description,
  disabled,
  icon: Icon,
  label,
  onClick,
  variant = "outline",
}: {
  description: string;
  disabled: boolean;
  icon: typeof Download;
  label: string;
  onClick: () => Promise<void> | void;
  variant?: "destructive" | "outline";
}) {
  return (
    <Item className="py-2">
      <ItemContent>
        <p className="text-sm font-medium">{label}</p>
        <ItemDescription>{description}</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button
          disabled={disabled}
          onClick={() => {
            void onClick();
          }}
          size="sm"
          variant={variant}
        >
          <Icon className="size-4" />
          {label}
        </Button>
      </ItemActions>
    </Item>
  );
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

function AutoBackupSettingsSection({
  onChange,
  onErrorMessage,
  onFeedbackMessage,
  settings,
}: {
  onChange: (settings: AppSettings) => void;
  onErrorMessage: (message: string | null) => void;
  onFeedbackMessage: (message: string | null) => void;
  settings: AppSettings;
}) {
  const [activeAutoBackupAction, setActiveAutoBackupAction] =
    useState<AutoBackupAction | null>(null);

  async function runAutoBackupAction(
    action: AutoBackupAction,
    execute: () => Promise<void>
  ): Promise<void> {
    setActiveAutoBackupAction(action);
    onErrorMessage(null);

    try {
      await execute();
    } catch (error) {
      onErrorMessage(
        error instanceof Error
          ? error.message
          : "Zucchini could not finish the auto backup action."
      );
    } finally {
      setActiveAutoBackupAction(null);
    }
  }

  return (
    <ItemGroup className="gap-0">
      <Item className="py-2">
        <ItemContent>
          <p className="text-sm font-medium">Auto backups</p>
          <ItemDescription>
            When enabled, save scheduled backup files in your local Zucchini
            data folder.
          </ItemDescription>
        </ItemContent>
        <ItemActions className="flex-wrap justify-end">
          <select
            aria-label="Auto backup cadence"
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            onChange={(event) => {
              onChange({
                ...settings,
                autoBackupCadence: event.currentTarget
                  .value as AutoBackupCadence,
              });
            }}
            value={settings.autoBackupCadence}
          >
            <option value="off">Off</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </ItemActions>
      </Item>

      <Item className="py-2">
        <ItemContent>
          <p className="text-sm font-medium">Backup folder</p>
          <ItemDescription>Reveal the auto backup folder.</ItemDescription>
        </ItemContent>
        <ItemActions className="flex-wrap justify-end">
          <Button
            disabled={activeAutoBackupAction !== null}
            onClick={() => {
              void runAutoBackupAction("openAutoFolder", async () => {
                const openedPath = await window.habits.openAutoBackupFolder();
                onFeedbackMessage(
                  `Opened ${getPathLabel(openedPath)} in your file manager.`
                );
              });
            }}
            size="sm"
            variant="outline"
          >
            <FolderOpen className="size-4" />
            Open backup folder
          </Button>
        </ItemActions>
      </Item>
    </ItemGroup>
  );
}

export function DataManagementSettingsCard({
  onChange,
  settings,
}: {
  onChange: (settings: AppSettings) => void;
  settings: AppSettings;
}) {
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
                  const openedPath = await window.habits.openDataFolder();
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
                  const exportedPath = await window.habits.exportBackup();

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
                  const exportedPath = await window.habits.exportCsvData();

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
              description="Restore from a backup file. Zucchini will restart after the import finishes."
              disabled={activeAction !== null}
              icon={Upload}
              label="Import backup"
              onClick={() => {
                setIsImportDialogOpen(true);
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
