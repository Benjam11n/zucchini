import type { AppIpcError } from "@/shared/contracts/ipc/app-errors";
import { toAppIpcError } from "@/shared/contracts/ipc/app-errors";

import { runAsyncTask } from "./async-task";
import type { RunAsyncTaskOptions } from "./async-task";

type RunAppIpcTaskOptions<TResult> = Omit<
  RunAsyncTaskOptions<TResult, AppIpcError>,
  "mapError"
>;

export function runAppIpcTask<TResult>(
  task: () => Promise<TResult>,
  options: RunAppIpcTaskOptions<TResult> & { rethrow: true }
): Promise<TResult>;
export function runAppIpcTask<TResult>(
  task: () => Promise<TResult>,
  options?: RunAppIpcTaskOptions<TResult> & { rethrow?: false }
): Promise<TResult | undefined>;
export function runAppIpcTask<TResult>(
  task: () => Promise<TResult>,
  options: RunAppIpcTaskOptions<TResult> = {}
) {
  if (options.rethrow) {
    return runAsyncTask(task, {
      ...options,
      mapError: toAppIpcError,
      rethrow: true,
    });
  }

  return runAsyncTask(task, {
    ...options,
    mapError: toAppIpcError,
    rethrow: false,
  });
}
