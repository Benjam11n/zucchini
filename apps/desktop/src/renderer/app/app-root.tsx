/**
 * Top-level React application composition.
 *
 * Keeps boot states visible at the root, then hands the ready application shell
 * to route composition.
 */
import { lazy, Suspense } from "react";

import { AppErrorBoundary } from "@/renderer/app/app-error-boundary";
import { AppReadyShell } from "@/renderer/app/app-ready-shell";
import { BootErrorScreen } from "@/renderer/app/boot-error-screen";
import { getBootErrorDisplay } from "@/renderer/app/boot/boot-errors";
import { appActions } from "@/renderer/app/controller/app-actions";
import { useAppController } from "@/renderer/app/controller/use-app-controller";
import { LoadingStateCard } from "@/renderer/app/loading-state-card";
import { useFocusTimer } from "@/renderer/features/focus/hooks/use-focus-timer";
import { useTodayStore } from "@/renderer/features/today/state/today-store";
import { Toaster } from "@/renderer/shared/components/ui/sonner";
import { getPomodoroTimerSettings } from "@/shared/domain/settings";

const FocusWidget = lazy(async () => {
  const module =
    await import("@/renderer/features/focus/components/focus-widget/focus-widget");

  return { default: module.FocusWidget };
});

type AppController = ReturnType<typeof useAppController>;
export type ReadyAppController = AppController & {
  state: AppController["state"] & {
    todayState: NonNullable<AppController["state"]["todayState"]>;
  };
};

function FocusTimerEffects() {
  const todayState = useTodayStore((state) => state.todayState);
  useFocusTimer({
    clearFocusSaveError: appActions.clearFocusSaveError,
    pomodoroSettings: todayState
      ? getPomodoroTimerSettings(todayState.settings)
      : null,
    recordFocusSession: appActions.recordFocusSession,
    setFocusSaveErrorMessage: appActions.setFocusSaveErrorMessage,
  });
  return null;
}

function MainApp() {
  const controller = useAppController();
  const { actions, state } = controller;

  if (state.bootPhase === "loading") {
    return (
      <LoadingStateCard
        description="Preparing your local habit dashboard."
        fullscreen
        title="Loading"
      />
    );
  }

  if (state.bootPhase === "error") {
    return (
      <BootErrorScreen
        errorDisplay={getBootErrorDisplay(state.bootError)}
        onRetry={actions.handleRetryBoot}
      />
    );
  }

  if (!state.todayState) {
    return null;
  }

  return <AppReadyShell controller={controller as ReadyAppController} />;
}

export default function App() {
  const view = new URLSearchParams(window.location.search).get("view");

  if (view === "widget") {
    return (
      <AppErrorBoundary
        description="The focus widget hit an unexpected error. Reload Zucchini to continue your session."
        title="Widget error"
      >
        <Suspense
          fallback={<div className="h-screen w-screen bg-transparent" />}
        >
          <FocusWidget />
        </Suspense>
      </AppErrorBoundary>
    );
  }

  return (
    <AppErrorBoundary
      description="The app hit an unexpected error. Reload Zucchini to continue."
      title="Unexpected app error"
    >
      <FocusTimerEffects />
      <MainApp />
      <Toaster />
    </AppErrorBoundary>
  );
}
