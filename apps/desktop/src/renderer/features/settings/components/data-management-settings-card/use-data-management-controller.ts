import { useState } from "react";

import { getPathLabel } from "@/renderer/features/settings/lib/data-management-format";
import type { BackupRestorePreview } from "@/shared/contracts/api/desktop-api";

import type {
  AutoBackupAction,
  DataAction,
} from "../../lib/data-management-types";
import type { SettingsPageActions } from "../../settings.types";

interface UseDataManagementControllerInput {
  actions: SettingsPageActions["dataManagement"];
}

function getDataActionErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Zucchini could not finish the data action.";
}

export function useDataManagementController({
  actions,
}: UseDataManagementControllerInput) {
  const [activeAction, setActiveAction] = useState<DataAction>(null);
  const [activeAutoBackupAction, setActiveAutoBackupAction] =
    useState<AutoBackupAction>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isClearDataDialogOpen, setIsClearDataDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasNoAutoBackup, setHasNoAutoBackup] = useState(false);
  const [restorePreview, setRestorePreview] =
    useState<BackupRestorePreview | null>(null);

  async function runDataAction(
    action: Exclude<DataAction, null>,
    execute: () => Promise<void>
  ): Promise<void> {
    setActiveAction(action);
    setErrorMessage(null);

    try {
      await execute();
    } catch (error) {
      setErrorMessage(getDataActionErrorMessage(error));
    } finally {
      setActiveAction(null);
    }
  }

  async function runAutoBackupAction(
    action: Exclude<AutoBackupAction, null>,
    execute: () => Promise<void>
  ): Promise<void> {
    setActiveAutoBackupAction(action);
    setErrorMessage(null);

    try {
      await execute();
    } catch (error) {
      setErrorMessage(getDataActionErrorMessage(error));
    } finally {
      setActiveAutoBackupAction(null);
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

  async function handleOpenDataFolder() {
    await runDataAction("open", async () => {
      const openedPath = await actions.openDataFolder();
      setFeedbackMessage(
        `Opened ${getPathLabel(openedPath)} in your file manager.`
      );
    });
  }

  async function handleOpenAutoBackupFolder() {
    await runAutoBackupAction("openAutoFolder", async () => {
      const openedPath = await actions.openAutoBackupFolder();
      setFeedbackMessage(
        `Opened ${getPathLabel(openedPath)} in your file manager.`
      );
    });
  }

  async function handleExportBackup() {
    await runDataAction("export", async () => {
      const exportedPath = await actions.exportBackup();

      if (exportedPath === null) {
        return;
      }

      setFeedbackMessage(`Backup exported as ${getPathLabel(exportedPath)}.`);
    });
  }

  async function handleExportCsvData() {
    await runDataAction("exportCsv", async () => {
      const exportedPath = await actions.exportCsvData();

      if (exportedPath === null) {
        return;
      }

      setFeedbackMessage(`CSV export saved in ${getPathLabel(exportedPath)}.`);
    });
  }

  async function handleGetLatestAutoBackupRestorePreview() {
    await runDataAction("chooseRestore", async () => {
      const preview = await actions.getLatestAutoBackupRestorePreview();
      setHasNoAutoBackup(preview === null);

      if (!preview) {
        setFeedbackMessage("No auto backup yet.");
        return;
      }

      openRestoreDialog(preview);
    });
  }

  async function handleChooseBackupForRestore() {
    await runDataAction("chooseRestore", async () => {
      const preview = await actions.chooseBackupForRestore();

      if (!preview) {
        return;
      }

      openRestoreDialog(preview);
    });
  }

  async function handleRestoreBackup() {
    if (!restorePreview) {
      return;
    }

    const { restoreId } = restorePreview;

    await runDataAction("restore", async () => {
      closeRestoreDialog(false);
      const didRestore = await actions.restoreBackup(restoreId);

      if (didRestore) {
        setFeedbackMessage("Restarting Zucchini with your backup.");
      }
    });
  }

  async function handleClearData() {
    await runDataAction("clear", async () => {
      setIsClearDataDialogOpen(false);
      const didClear = await actions.clearData();

      if (didClear) {
        setFeedbackMessage("Restarting Zucchini with a fresh local database.");
      }
    });
  }

  return {
    activeAction,
    activeAutoBackupAction,
    closeRestoreDialog,
    errorMessage,
    feedbackMessage,
    handleChooseBackupForRestore,
    handleClearData,
    handleExportBackup,
    handleExportCsvData,
    handleGetLatestAutoBackupRestorePreview,
    handleOpenAutoBackupFolder,
    handleOpenDataFolder,
    handleRestoreBackup,
    hasNoAutoBackup,
    isClearDataDialogOpen,
    isRestoreDialogOpen,
    restorePreview,
    setIsClearDataDialogOpen,
  };
}
