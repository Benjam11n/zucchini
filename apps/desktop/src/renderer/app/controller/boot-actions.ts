/**
 * Boot and initialization action creators.
 *
 * Handles the initial data load that turns the app from "loading" to "ready"
 * state. On failure, resets all feature stores to their initial state and
 * surfaces the boot error so the user can retry.
 */
import { useBootStore } from "@/renderer/app/state/boot-store";
import { runAsyncTask } from "@/renderer/shared/lib/async-task";
import { toHabitsIpcError } from "@/shared/contracts/habits-ipc-errors";

import { applyBootFailureState } from "./action-helpers";
import type { ReloadAllFn } from "./today-actions";

export function createBootActions({ reloadAll }: { reloadAll: ReloadAllFn }) {
  async function bootApp() {
    await runAsyncTask(() => reloadAll(), {
      mapError: toHabitsIpcError,
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
