import {
  AlertTriangle,
  Download,
  FileSpreadsheet,
  FolderOpen,
  HardDriveDownload,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { SettingsCardHeader } from "@/renderer/features/settings/components/settings-card-header";
import { getHabitCadenceSummary } from "@/renderer/shared/components/habit-management/habit-cadence-summary";
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
import { getHabitCategoryPresentation } from "@/renderer/shared/lib/habit-category-presentation";
import { clearZucchiniStorage } from "@/renderer/shared/lib/storage";
import type { BackupRestorePreview } from "@/shared/contracts/habits-api";
import {
  normalizeHabitCategory,
  normalizeHabitFrequency,
  normalizeHabitTargetCount,
  normalizeHabitWeekdays,
} from "@/shared/domain/habit";
import type { Habit } from "@/shared/domain/habit";
import type { AppSettings, AutoBackupCadence } from "@/shared/domain/settings";

type DataAction =
  | "chooseRestore"
  | "clear"
  | "export"
  | "exportCsv"
  | "open"
  | "restore"
  | null;
type AutoBackupAction = "openAutoFolder";

function getPathLabel(filePath: string): string {
  return filePath.split(/[/\\]/).at(-1) ?? filePath;
}

function formatBackupSize(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatBackupDate(value: string | null): string {
  if (!value) {
    return "None";
  }

  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function toRestoreSnapshotHabit(
  habit: BackupRestorePreview["habits"][number]
): Habit {
  const frequency = normalizeHabitFrequency(habit.frequency);

  return {
    category: normalizeHabitCategory(habit.category),
    createdAt: "",
    frequency,
    id: habit.id,
    isArchived: false,
    name: habit.name,
    pausedAt: habit.pausedAt,
    selectedWeekdays: normalizeHabitWeekdays(habit.selectedWeekdays),
    sortOrder: habit.sortOrder,
    targetCount: normalizeHabitTargetCount(frequency, habit.targetCount),
  };
}

function RestoreHabitSnapshot({ preview }: { preview: BackupRestorePreview }) {
  if (preview.habits.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 px-4 py-4 text-center text-sm text-muted-foreground">
        No active habits in this backup.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/70 bg-muted/15 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Habits in backup</p>
        <span className="text-xs text-muted-foreground">
          {preview.habits.length}
          {preview.habitPreviewTotalCount > preview.habits.length
            ? ` of ${preview.habitPreviewTotalCount}`
            : ""}
        </span>
      </div>

      <div className="grid max-h-40 gap-1 overflow-y-auto pr-1">
        {preview.habits.map((habitPreview) => {
          const habit = toRestoreSnapshotHabit(habitPreview);
          const presentation = getHabitCategoryPresentation(habit.category);

          return (
            <div
              className="flex min-w-0 items-center gap-3 rounded-md px-2 py-1.5 text-sm"
              key={habit.id}
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: presentation.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-foreground">{habit.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {presentation.label} · {getHabitCadenceSummary(habit)}
                </p>
              </div>
              {habit.pausedAt ? (
                <span className="shrink-0 rounded-md border border-border/70 px-2 py-1 text-xs text-muted-foreground">
                  Paused
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RestoreBackupDialog({
  activeAction,
  onOpenChange,
  onRestore,
  open,
  preview,
}: {
  activeAction: DataAction;
  onOpenChange: (open: boolean) => void;
  onRestore: () => Promise<void>;
  open: boolean;
  preview: BackupRestorePreview | null;
}) {
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
              description="Preview and restore the latest scheduled backup."
              disabled={activeAction !== null}
              icon={RotateCcw}
              label="Restore latest"
              onClick={async () => {
                await runAction("chooseRestore", async () => {
                  const preview =
                    await window.habits.getLatestAutoBackupRestorePreview();
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
                  const preview = await window.habits.chooseBackupForRestore();

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
            const didRestore = await window.habits.restoreBackup(restoreId);

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
