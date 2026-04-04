/* eslint-disable promise/prefer-await-to-then */

import { Download, RefreshCw, Rocket } from "lucide-react";

import { clearDismissedUpdateVersion } from "@/renderer/app/shell/update-toast-storage";
import { SettingsCardHeader } from "@/renderer/features/settings/components/settings-card-header";
import { Button } from "@/renderer/shared/components/ui/button";
import { Card, CardContent } from "@/renderer/shared/components/ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
} from "@/renderer/shared/components/ui/item";
import { Spinner } from "@/renderer/shared/components/ui/spinner";
import { useAppUpdaterState } from "@/renderer/shared/hooks/use-app-updater-state";
import type { AppUpdateState } from "@/shared/contracts/app-updater";

function getActionLabel(state: AppUpdateState): string {
  if (state.status === "downloaded") {
    return "Restart to update";
  }

  if (state.status === "downloading") {
    return "Downloading update";
  }

  if (state.status === "checking") {
    return "Checking for updates";
  }

  if (state.status === "available") {
    return "Download update";
  }

  if (state.status === "error" && state.availableVersion !== null) {
    return "Retry update";
  }

  return "Check for updates";
}

function getStatusCopy(state: AppUpdateState): string {
  if (state.status === "downloaded") {
    return (
      state.errorMessage ??
      `Version ${state.availableVersion} is ready to install.`
    );
  }

  if (state.status === "downloading") {
    return `${state.progressPercent ?? 0}% downloaded for version ${state.availableVersion}.`;
  }

  if (state.status === "checking") {
    return "Looking for a newer version.";
  }

  if (state.status === "available") {
    return `Version ${state.availableVersion} is available.`;
  }

  if (state.status === "error" && state.availableVersion !== null) {
    return (
      state.errorMessage ??
      `Version ${state.availableVersion} is available, but the last download attempt failed.`
    );
  }

  if (state.status === "error") {
    return state.errorMessage ?? "The last update check failed.";
  }

  return `Current version ${state.currentVersion}.`;
}

function getActionIcon({
  isPending,
  state,
}: {
  isPending: boolean;
  state: AppUpdateState;
}) {
  if (
    isPending ||
    state.status === "checking" ||
    state.status === "downloading"
  ) {
    return <Spinner className="size-4" />;
  }

  if (state.status === "available") {
    return <Download className="size-4" />;
  }

  if (state.status === "downloaded") {
    return <Rocket className="size-4" />;
  }

  return <RefreshCw className="size-4" />;
}

export function UpdateSettingsCard() {
  const { runPrimaryAction, viewState } = useAppUpdaterState({
    allowManualCheck: true,
    onBeforeCheck: clearDismissedUpdateVersion,
  });

  if (viewState.state === null || viewState.state.status === "unavailable") {
    return null;
  }

  return (
    <Card>
      <SettingsCardHeader
        description="Check for new desktop releases and install them."
        icon={RefreshCw}
        title="App updates"
      />
      <CardContent>
        <ItemGroup className="gap-0">
          <Item className="py-2">
            <ItemContent>
              <p className="text-sm font-medium">Update status</p>
              <ItemDescription>
                {viewState.actionError ?? getStatusCopy(viewState.state)}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button
                className="min-w-40"
                disabled={
                  viewState.isPending ||
                  viewState.state.status === "checking" ||
                  viewState.state.status === "downloading"
                }
                id="check-for-updates"
                onClick={runPrimaryAction}
                size="sm"
                variant="outline"
              >
                {getActionIcon({
                  isPending: viewState.isPending,
                  state: viewState.state,
                })}
                {getActionLabel(viewState.state)}
              </Button>
            </ItemActions>
          </Item>
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
