import { runAsyncTask } from "@/renderer/shared/lib/async-task";
import { toAppIpcError } from "@/shared/contracts/ipc/app-errors";

interface RunHabitActionInput {
  onSuccess?: () => void | Promise<void>;
  task: () => Promise<void>;
}

interface UseHabitActionRunnerInput {
  onError: (message: string) => void;
}

export function useHabitActionRunner({ onError }: UseHabitActionRunnerInput) {
  return async function runHabitAction({
    onSuccess,
    task,
  }: RunHabitActionInput) {
    await runAsyncTask(task, {
      mapError: toAppIpcError,
      onError: (error) => {
        onError(error.message);
      },
      ...(onSuccess ? { onSuccess } : {}),
    });
  };
}
