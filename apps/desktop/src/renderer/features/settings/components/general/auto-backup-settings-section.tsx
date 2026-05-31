import { FolderOpen } from "lucide-react";
import { useState } from "react";

import { Button } from "@/renderer/shared/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
} from "@/renderer/shared/components/ui/item";
import type { AppSettings, AutoBackupCadence } from "@/shared/domain/settings";

import { getPathLabel } from "../../lib/data-management-format";

type AutoBackupAction = "openAutoFolder";

interface AutoBackupSettingsSectionProps {
  onChange: (settings: AppSettings) => void;
  onErrorMessage: (message: string | null) => void;
  onFeedbackMessage: (message: string | null) => void;
  settings: AppSettings;
}

export function AutoBackupSettingsSection({
  onChange,
  onErrorMessage,
  onFeedbackMessage,
  settings,
}: AutoBackupSettingsSectionProps) {
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
                const openedPath = await window.desktop.openAutoBackupFolder();
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
