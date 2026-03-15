import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { Download, Rocket, RotateCcw, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useReducer, useState } from "react";

import { Button } from "@/renderer/shared/ui/button";
import { Spinner } from "@/renderer/shared/ui/spinner";
import type { AppUpdateState } from "@/shared/contracts/app-updater";

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
  detailLabel: string;
} {
  if (state.status === "downloaded") {
    return {
      actionLabel: "Restart to update",
      detailLabel:
        state.errorMessage ?? `Version ${state.availableVersion} is ready`,
    };
  }

  if (state.status === "downloading") {
    return {
      actionLabel: "Downloading update",
      detailLabel: `${state.progressPercent ?? 0}% complete`,
    };
  }

  if (state.status === "error") {
    return {
      actionLabel: "Retry update",
      detailLabel:
        state.errorMessage ?? `Version ${state.availableVersion} is available`,
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

function UpdateButtonBanner({
  actionLabel,
  detailLabel,
  disabled,
  icon,
  onAction,
}: {
  actionLabel: string;
  detailLabel: string;
  disabled: boolean;
  icon: ReactNode;
  onAction: () => Promise<void>;
}) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        <m.div
          animate={{ opacity: 1, x: 0, y: 0 }}
          className="pointer-events-none fixed bottom-4 left-4 z-50 sm:bottom-6 sm:left-6"
          exit={{ opacity: 0, x: -16, y: 16 }}
          initial={{ opacity: 0, x: -16, y: 16 }}
        >
          <div className="pointer-events-auto relative">
            <Button
              aria-label="Dismiss update notification"
              className="absolute top-3 right-3 z-10 rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => {
                setIsDismissed(true);
              }}
              size="icon-xs"
              variant="ghost"
            >
              <X className="size-3.5" />
            </Button>

            <Button
              className="h-auto min-w-60 justify-start gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3 pr-12 text-left text-card-foreground shadow-lg backdrop-blur-sm hover:bg-card/90"
              disabled={disabled}
              onClick={() => {
                void onAction();
              }}
              variant="outline"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                {icon}
              </span>

              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold tracking-tight">
                  {actionLabel}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {detailLabel}
                </span>
              </span>
            </Button>
          </div>
        </m.div>
      </AnimatePresence>
    </LazyMotion>
  );
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

  if (viewState.state === null || !shouldRenderUpdateButton(viewState.state)) {
    return null;
  }

  const { actionLabel, detailLabel } = getButtonCopy(viewState.state);
  const dismissalKey = [
    viewState.state.status,
    viewState.state.availableVersion,
    viewState.state.errorMessage,
  ].join(":");
  const isDownloading = viewState.state.status === "downloading";

  return (
    <UpdateButtonBanner
      key={dismissalKey}
      actionLabel={actionLabel}
      detailLabel={viewState.actionError ?? detailLabel}
      disabled={viewState.isPending || isDownloading}
      icon={getButtonIcon({
        isDownloading,
        isPending: viewState.isPending,
        status: viewState.state.status,
      })}
      onAction={handleClick}
    />
  );
}
