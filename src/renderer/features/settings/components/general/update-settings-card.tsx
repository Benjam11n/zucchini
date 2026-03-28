/* eslint-disable promise/prefer-await-to-then */

import { Download, RefreshCw, Rocket } from "lucide-react";
import { useEffect, useReducer } from "react";

import { Button } from "@/renderer/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/renderer/shared/ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
} from "@/renderer/shared/ui/item";
import { Spinner } from "@/renderer/shared/ui/spinner";
import type { AppUpdateState } from "@/shared/contracts/app-updater";

interface UpdateSettingsViewState {
  actionError: string | null;
  isPending: boolean;
  state: AppUpdateState | null;
}

type UpdateSettingsAction =
  | { actionError: string; type: "actionFailed" }
  | { state: AppUpdateState; type: "loadSucceeded" }
  | { type: "startAction" };

const INITIAL_UPDATE_SETTINGS_STATE: UpdateSettingsViewState = {
  actionError: null,
  isPending: true,
  state: null,
};

function updateSettingsReducer(
  state: UpdateSettingsViewState,
  action: UpdateSettingsAction
): UpdateSettingsViewState {
  switch (action.type) {
    case "actionFailed": {
      return {
        ...state,
        actionError: action.actionError,
        isPending: false,
      };
    }
    case "loadSucceeded": {
      return {
        actionError: null,
        isPending: false,
        state: action.state,
      };
    }
    case "startAction": {
      return {
        ...state,
        actionError: null,
        isPending: true,
      };
    }
    default: {
      return state;
    }
  }
}

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
  const [viewState, dispatch] = useReducer(
    updateSettingsReducer,
    INITIAL_UPDATE_SETTINGS_STATE
  );

  useEffect(() => {
    let isSubscribed = true;

    const loadState = async (): Promise<void> => {
      try {
        const nextState = await window.updater.getState();
        if (isSubscribed) {
          dispatch({ state: nextState, type: "loadSucceeded" });
        }
      } catch (error) {
        if (isSubscribed) {
          dispatch({
            actionError:
              error instanceof Error
                ? error.message
                : "Zucchini could not load update status.",
            type: "actionFailed",
          });
        }
      }
    };

    loadState().catch(() => {
      // `loadState` handles the user-visible failure state internally.
    });

    const unsubscribe = window.updater.onStateChange((nextState) => {
      dispatch({ state: nextState, type: "loadSucceeded" });
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, []);

  async function handleClick(): Promise<void> {
    if (
      viewState.state === null ||
      viewState.state.status === "checking" ||
      viewState.state.status === "downloading" ||
      viewState.state.status === "unavailable"
    ) {
      return;
    }

    dispatch({ type: "startAction" });

    try {
      if (viewState.state.status === "downloaded") {
        await window.updater.installUpdate();
        return;
      }

      if (
        viewState.state.status === "available" ||
        (viewState.state.status === "error" &&
          viewState.state.availableVersion !== null)
      ) {
        await window.updater.downloadUpdate();
        return;
      }

      await window.updater.checkForUpdates();
    } catch (error) {
      dispatch({
        actionError:
          error instanceof Error
            ? error.message
            : "Zucchini could not finish the update action.",
        type: "actionFailed",
      });
    }
  }

  if (viewState.state === null || viewState.state.status === "unavailable") {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardDescription>Maintenance</CardDescription>
        <div className="flex items-center gap-2">
          <RefreshCw className="size-4 text-primary" />
          <CardTitle>App updates</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ItemGroup className="gap-0">
          <Item className="py-2">
            <ItemContent>
              <p className="text-sm font-medium">Update status</p>
              <ItemDescription className="text-xs leading-snug">
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
                onClick={handleClick}
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
