import { runAppIpcTask } from "@/renderer/shared/lib/app-ipc-task";

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
    await runAppIpcTask(task, {
      onError: (error) => {
        onError(error.message);
      },
      ...(onSuccess ? { onSuccess } : {}),
    });
  };
}
