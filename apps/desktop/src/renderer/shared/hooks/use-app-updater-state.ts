import { useEffect, useReducer } from "react";

import type { AppUpdateState } from "@/shared/contracts/app-updater";

interface AppUpdaterViewState {
  actionError: string | null;
  isPending: boolean;
  state: AppUpdateState | null;
}

type AppUpdaterAction =
  | { actionError: string; type: "actionFailed" }
  | { state: AppUpdateState; type: "loadSucceeded" }
  | { type: "startAction" };

const INITIAL_APP_UPDATER_STATE: AppUpdaterViewState = {
  actionError: null,
  isPending: true,
  state: null,
};

function appUpdaterViewReducer(
  state: AppUpdaterViewState,
  action: AppUpdaterAction
): AppUpdaterViewState {
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

function toActionErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Zucchini could not finish the update action.";
}

function toLoadErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Zucchini could not load update status.";
}

interface UseAppUpdaterStateOptions {
  allowManualCheck?: boolean;
  onBeforeCheck?: () => void;
}

export function useAppUpdaterState({
  allowManualCheck = false,
  onBeforeCheck,
}: UseAppUpdaterStateOptions = {}) {
  const [viewState, dispatch] = useReducer(
    appUpdaterViewReducer,
    INITIAL_APP_UPDATER_STATE
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
            actionError: toLoadErrorMessage(error),
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

  async function runPrimaryAction(): Promise<void> {
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

      if (!allowManualCheck) {
        dispatch({ state: viewState.state, type: "loadSucceeded" });
        return;
      }

      onBeforeCheck?.();
      await window.updater.checkForUpdates();
    } catch (error) {
      dispatch({
        actionError: toActionErrorMessage(error),
        type: "actionFailed",
      });
    }
  }

  return {
    runPrimaryAction,
    viewState,
  };
}
