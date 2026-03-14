import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { Download, Rocket, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useReducer } from "react";

import { cn } from "@/renderer/shared/lib/class-names";
import { Button } from "@/renderer/shared/ui/button";
import { Spinner } from "@/renderer/shared/ui/spinner";
import type { AppUpdateState } from "@/shared/contracts/app-updater";

function shouldRenderUpdateButton(state: AppUpdateState): boolean {
  return state.status !== "unavailable";
}

function getButtonCopy(state: AppUpdateState): {
  actionLabel: string;
  detailLabel: string;
} {
  if (state.status === "downloaded") {
    return {
      actionLabel: "Restart to update",
      detailLabel: `Version ${state.availableVersion} is ready`,
    };
  }

  if (state.status === "downloading") {
    return {
      actionLabel: "Downloading update",
      detailLabel: `${state.progressPercent ?? 0}% complete`,
    };
  }

  if (state.status === "checking") {
    return {
      actionLabel: "Checking for updates",
      detailLabel: `Current version ${state.currentVersion}`,
    };
  }

  if (state.status === "error") {
    return {
      actionLabel:
        state.availableVersion === null ? "Check for updates" : "Retry update",
      detailLabel:
        state.errorMessage ??
        (state.availableVersion === null
          ? `Current version ${state.currentVersion}`
          : `Version ${state.availableVersion} is available`),
    };
  }

  if (state.status === "idle") {
    return {
      actionLabel: "Check for updates",
      detailLabel: `Current version ${state.currentVersion}`,
    };
  }

  return {
    actionLabel: "Download update",
    detailLabel: `Version ${state.availableVersion} is available`,
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

  if (status === "idle") {
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

    void loadState();

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

  if (viewState.state === null || !shouldRenderUpdateButton(viewState.state)) {
    return null;
  }

  const { actionLabel, detailLabel } = getButtonCopy(viewState.state);
  const isChecking = viewState.state.status === "checking";
  const isDownloading = viewState.state.status === "downloading";
  const isRestartReady = viewState.state.status === "downloaded";

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        <m.div
          animate={{ opacity: 1, x: 0, y: 0 }}
          className="pointer-events-none fixed bottom-4 left-4 z-50 sm:bottom-6 sm:left-6"
          exit={{ opacity: 0, x: -16, y: 16 }}
          initial={{ opacity: 0, x: -16, y: 16 }}
        >
          <Button
            className={cn(
              "pointer-events-auto h-auto min-w-60 justify-start gap-3 rounded-2xl border border-border/80 px-4 py-3 text-left shadow-lg backdrop-blur-sm",
              isRestartReady
                ? "bg-secondary text-secondary-foreground"
                : "bg-card text-card-foreground hover:bg-card/90"
            )}
            disabled={viewState.isPending || isChecking || isDownloading}
            onClick={() => {
              void handleClick();
            }}
            variant={isRestartReady ? "secondary" : "outline"}
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
              {getButtonIcon({
                isDownloading,
                isPending: viewState.isPending,
                status: viewState.state.status,
              })}
            </span>

            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold tracking-tight">
                {actionLabel}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {viewState.actionError ?? detailLabel}
              </span>
            </span>
          </Button>
        </m.div>
      </AnimatePresence>
    </LazyMotion>
  );
}
