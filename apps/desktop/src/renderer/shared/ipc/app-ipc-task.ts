import type { AppIpcError } from "@/shared/contracts/ipc/app-errors";
import { toAppIpcError } from "@/shared/contracts/ipc/app-errors";

type MaybePromise<T> = Promise<T> | T;

interface RunAppIpcTaskOptions<TResult> {
  onError?: (error: AppIpcError, originalError: unknown) => MaybePromise<void>;
  onFinally?: () => MaybePromise<void>;
  onStart?: () => MaybePromise<void>;
  onSuccess?: (result: TResult) => MaybePromise<void>;
  rethrow?: boolean;
}

export async function runAppIpcTask<TResult>(
  task: () => Promise<TResult>,
  options: RunAppIpcTaskOptions<TResult> = {}
): Promise<TResult | undefined> {
  await options.onStart?.();

  try {
    const result = await task();
    await options.onSuccess?.(result);
    return result;
  } catch (error) {
    await options.onError?.(toAppIpcError(error), error);

    if (options.rethrow) {
      throw error;
    }

    return undefined;
  } finally {
    await options.onFinally?.();
  }
}
