import { runAppIpcTask } from "@/renderer/shared/lib/app-ipc-task";
import type { AppIpcError } from "@/shared/contracts/ipc/app-errors";

type StorePatch<TState> =
  | Partial<TState>
  | ((state: TState) => Partial<TState>);

type StoreSet<TState> = (patch: StorePatch<TState>) => void;

interface RunStoreLoadOptions<TState, TResult> {
  error: (error: AppIpcError) => StorePatch<TState>;
  loading: StorePatch<TState>;
  set: StoreSet<TState>;
  success: (
    result: TResult
  ) => StorePatch<TState> | Promise<StorePatch<TState>>;
  task: () => Promise<TResult>;
}

export async function runStoreLoad<TState, TResult>({
  error,
  loading,
  set,
  success,
  task,
}: RunStoreLoadOptions<TState, TResult>): Promise<void> {
  await runAppIpcTask(task, {
    onError: (loadError) => {
      set(error(loadError));
    },
    onStart: () => {
      set(loading);
    },
    onSuccess: async (result) => {
      set(await success(result));
    },
  });
}
