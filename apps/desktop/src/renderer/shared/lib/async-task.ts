/**
 * Async task execution utility.
 *
 * Provides a structured way to run async operations with lifecycle callbacks
 * (`onStart`, `onSuccess`, `onError`, `onFinally`) and optional error
 * mapping. Used throughout the renderer for IPC calls that update Zustand
 * stores on success or failure.
 */
type MaybePromise<T> = Promise<T> | T;

interface RunAsyncTaskOptions<TResult, THandledError> {
  mapError?: (error: unknown) => THandledError;
  onError?: (
    error: THandledError,
    originalError: unknown
  ) => MaybePromise<void>;
  onFinally?: () => MaybePromise<void>;
  onStart?: () => MaybePromise<void>;
  onSuccess?: (result: TResult) => MaybePromise<void>;
  rethrow?: boolean;
}

interface RunAsyncTaskWithRethrow<
  TResult,
  THandledError,
> extends RunAsyncTaskOptions<TResult, THandledError> {
  rethrow: true;
}

interface RunAsyncTaskWithoutRethrow<
  TResult,
  THandledError,
> extends RunAsyncTaskOptions<TResult, THandledError> {
  rethrow?: false;
}

export async function runAsyncTask<TResult, THandledError = unknown>(
  task: () => Promise<TResult>,
  options: RunAsyncTaskWithRethrow<TResult, THandledError>
): Promise<TResult>;
export async function runAsyncTask<TResult, THandledError = unknown>(
  task: () => Promise<TResult>,
  options?: RunAsyncTaskWithoutRethrow<TResult, THandledError>
): Promise<TResult | undefined>;
export async function runAsyncTask<TResult, THandledError = unknown>(
  task: () => Promise<TResult>,
  {
    mapError,
    onError,
    onFinally,
    onStart,
    onSuccess,
    rethrow = false,
  }: RunAsyncTaskOptions<TResult, THandledError> = {}
): Promise<TResult | undefined> {
  await onStart?.();

  try {
    const result = await task();
    await onSuccess?.(result);
    return result;
  } catch (error) {
    if (onError) {
      const handledError = mapError
        ? mapError(error)
        : (error as THandledError);
      await onError(handledError, error);
    }

    if (rethrow) {
      throw error;
    }

    return undefined;
  } finally {
    await onFinally?.();
  }
}
