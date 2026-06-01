/**
 * Boot and initialization action creators.
 *
 * Handles the initial data load that turns the app from "loading" to "ready"
 * state. On failure, resets all feature stores to their initial state and
 * surfaces the boot error so the user can retry.
 */
import { useBootStore } from "@/renderer/app/state/boot-store";
import { runAppIpcTask } from "@/renderer/shared/lib/app-ipc-task";

import { applyBootFailureState } from "./action-helpers";
import type { ReloadAllFn } from "./today-actions";

export function createBootActions({ reloadAll }: { reloadAll: ReloadAllFn }) {
  async function bootApp() {
    await runAppIpcTask(() => reloadAll(), {
      onError: (bootError) => {
        applyBootFailureState(bootError);
      },
      onStart: () => {
        useBootStore.setState({
          bootError: null,
          bootPhase: "loading",
        });
      },
      onSuccess: () => {
        useBootStore.setState({
          bootPhase: "ready",
        });
      },
    });
  }

  return {
    bootApp,
    retryBoot: bootApp,
  };
}
