import { AnimatePresence, motion } from "framer-motion";
import { Download, Rocket, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/renderer/shared/lib/class-names";
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
      detailLabel: `Version ${state.availableVersion} is ready`,
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

export function UpdateButton() {
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [state, setState] = useState<AppUpdateState | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    const loadState = async (): Promise<void> => {
      try {
        const nextState = await window.updater.getState();
        if (isSubscribed) {
          setState(nextState);
        }
      } catch (error) {
        if (isSubscribed) {
          setActionError(
            error instanceof Error
              ? error.message
              : "Zucchini could not load update status."
          );
        }
      } finally {
        if (isSubscribed) {
          setIsPending(false);
        }
      }
    };

    void loadState();

    const unsubscribe = window.updater.onStateChange((nextState) => {
      setActionError(null);
      setState(nextState);
      setIsPending(false);
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, []);

  async function handleClick(): Promise<void> {
    if (state === null || state.status === "downloading") {
      return;
    }

    setActionError(null);
    setIsPending(true);

    try {
      await (state.status === "downloaded"
        ? window.updater.installUpdate()
        : window.updater.downloadUpdate());
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Zucchini could not finish the update action."
      );
      setIsPending(false);
    }
  }

  if (state === null || !shouldRenderUpdateButton(state)) {
    return null;
  }

  const { actionLabel, detailLabel } = getButtonCopy(state);
  const isDownloading = state.status === "downloading";
  const isRestartReady = state.status === "downloaded";

  return (
    <AnimatePresence>
      <motion.div
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
          disabled={isPending || isDownloading}
          onClick={() => {
            void handleClick();
          }}
          variant={isRestartReady ? "secondary" : "outline"}
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
            {getButtonIcon({
              isDownloading,
              isPending,
              status: state.status,
            })}
          </span>

          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold tracking-tight">
              {actionLabel}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {actionError ?? detailLabel}
            </span>
          </span>
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}
