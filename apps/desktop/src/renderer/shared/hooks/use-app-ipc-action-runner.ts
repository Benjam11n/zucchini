import { runAppIpcTask } from "@/renderer/shared/lib/app-ipc-task";

type MaybePromise<T> = Promise<T> | T;

type ActionCallback = () => MaybePromise<void>;

export function useAppIpcActionRunner({
  onError,
  onSuccess,
}: {
  onError: (message: string) => void;
  onSuccess?: ActionCallback;
}) {
  return async function runAppIpcAction(
    task: () => Promise<void>,
    options: { onSuccess?: ActionCallback } = {}
  ): Promise<boolean> {
    let didSucceed = false;

    await runAppIpcTask(task, {
      onError: (error) => {
        onError(error.message);
      },
      onSuccess: () => {
        didSucceed = true;
        return Promise.resolve(onSuccess?.()).then(options.onSuccess);
      },
    });

    return didSucceed;
  };
}
