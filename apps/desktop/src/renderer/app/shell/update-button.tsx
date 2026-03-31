/* eslint-disable promise/prefer-await-to-then */

import { Download, Rocket, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import {
  useEffect,
  useEffectEvent,
  useMemo,
  useReducer,
  useState,
} from "react";
import { toast } from "sonner";

import { Spinner } from "@/renderer/shared/components/ui/spinner";
import type { AppUpdateState } from "@/shared/contracts/app-updater";

import {
  readDismissedUpdateVersion,
  writeDismissedUpdateVersion,
} from "./update-toast-storage";

const UPDATE_TOAST_ID = "app-update";

function shouldRenderUpdateButton(state: AppUpdateState): boolean {
  return (
    state.status === "available" ||
    state.status === "downloaded" ||
    state.status === "downloading" ||
    (state.status === "error" && state.availableVersion !== null)
  );
}

function getButtonCopy(state: AppUpdateState): {
  actionLabel: string;
  descriptionLabel: string;
  detailLabel: string;
  titleLabel: string;
} {
  if (state.status === "downloaded") {
    return {
      actionLabel: "Restart to update",
      descriptionLabel:
        state.errorMessage ?? `Version ${state.availableVersion} is ready`,
      detailLabel:
        state.errorMessage ?? `Version ${state.availableVersion} is ready`,
      titleLabel: "Update ready",
    };
  }

  if (state.status === "downloading") {
    return {
      actionLabel: "Downloading update",
      descriptionLabel: `Version ${state.availableVersion} is downloading`,
      detailLabel: `${state.progressPercent ?? 0}% complete`,
      titleLabel: "Downloading update",
    };
  }

  if (state.status === "error") {
    return {
      actionLabel: "Retry update",
      descriptionLabel:
        state.errorMessage ?? `Version ${state.availableVersion} is available`,
      detailLabel:
        state.errorMessage ?? `Version ${state.availableVersion} is available`,
      titleLabel: "Update failed",
    };
  }

  return {
    actionLabel: "Download update",
    descriptionLabel: `Version ${state.availableVersion} is available`,
    detailLabel: `Version ${state.availableVersion} is available`,
    titleLabel: "Update available",
  };
}

function getButtonIcon({
  isDownloading,
  isPending,
  status,
}: {
  isDownloading: boolean;
  isPending: boolean;
  status: AppUpdateState["status"];
}): ReactNode {
  if (isDownloading || isPending) {
    return <Spinner className="size-4" />;
  }

  if (status === "error") {
    return <RotateCcw className="size-4" />;
  }

  if (status === "available") {
    return <Download className="size-4" />;
  }

  return <Rocket className="size-4" />;
}

interface UpdateButtonViewState {
  actionError: string | null;
  isPending: boolean;
  state: AppUpdateState | null;
}

type UpdateButtonAction =
  | { actionError: string; type: "actionFailed" }
  | { state: AppUpdateState; type: "loadSucceeded" }
  | { type: "startAction" };

const INITIAL_UPDATE_BUTTON_STATE: UpdateButtonViewState = {
  actionError: null,
  isPending: true,
  state: null,
};

// CHECK: this reducer/load/subscribe/action flow is very similar to
// `UpdateSettingsCard`. Consider extracting a shared updater view-model hook so
// the two surfaces do not drift.
function updateButtonViewReducer(
  state: UpdateButtonViewState,
  action: UpdateButtonAction
): UpdateButtonViewState {
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

export function UpdateButton() {
  const [viewState, dispatch] = useReducer(
    updateButtonViewReducer,
    INITIAL_UPDATE_BUTTON_STATE
  );
  const [dismissedVersions, setDismissedVersions] = useState<Set<string>>(
    () => {
      const dismissedVersion = readDismissedUpdateVersion();

      return dismissedVersion ? new Set([dismissedVersion]) : new Set();
    }
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

  const handleDismiss = (dismissedVersion: string) => {
    writeDismissedUpdateVersion(dismissedVersion);
    setDismissedVersions(
      (currentKeys) => new Set([...currentKeys, dismissedVersion])
    );
    toast.dismiss(UPDATE_TOAST_ID);
  };

  async function handleClick(): Promise<void> {
    if (
      viewState.state === null ||
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
      }
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

  const dismissToast = useEffectEvent((dismissalKey: string) => {
    handleDismiss(dismissalKey);
  });

  const runToastAction = useEffectEvent(async () => {
    await handleClick();
  });

  const visibleState = useMemo(() => {
    if (
      viewState.state === null ||
      !shouldRenderUpdateButton(viewState.state)
    ) {
      return null;
    }

    const dismissalKey = viewState.state.availableVersion;
    if (dismissalKey === null) {
      return null;
    }

    if (dismissedVersions.has(dismissalKey)) {
      return null;
    }

    return {
      dismissalKey,
      state: viewState.state,
    };
  }, [dismissedVersions, viewState.state]);

  useEffect(() => {
    if (visibleState === null) {
      toast.dismiss(UPDATE_TOAST_ID);
      return;
    }

    const { actionLabel, descriptionLabel, detailLabel, titleLabel } =
      getButtonCopy(visibleState.state);
    const isDownloading = visibleState.state.status === "downloading";

    toast(titleLabel, {
      action:
        isDownloading || viewState.isPending
          ? undefined
          : {
              label: actionLabel,
              onClick: () => {
                runToastAction();
              },
            },
      cancel: {
        label: "Dismiss",
        onClick: () => {
          dismissToast(visibleState.dismissalKey);
        },
      },
      description:
        viewState.actionError ??
        (isDownloading ? detailLabel : descriptionLabel),
      duration: Number.POSITIVE_INFINITY,
      icon: getButtonIcon({
        isDownloading,
        isPending: viewState.isPending,
        status: visibleState.state.status,
      }),
      id: UPDATE_TOAST_ID,
    });
  }, [viewState.actionError, viewState.isPending, visibleState]);

  return null;
}
