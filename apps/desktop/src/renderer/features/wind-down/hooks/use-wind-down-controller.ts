import { useState } from "react";

import type { WindDownPageActions } from "@/renderer/features/wind-down/wind-down.types";
import { runAppIpcTask } from "@/renderer/shared/lib/app-ipc-task";

export function useWindDownController(actions: WindDownPageActions) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function runWindDownAction(task: () => Promise<void>) {
    let didSucceed = false;

    await runAppIpcTask(task, {
      onError: (error) => {
        setErrorMessage(error.message);
      },
      onSuccess: () => {
        didSucceed = true;
        setErrorMessage(null);
      },
    });

    return didSucceed;
  }

  return {
    actions: {
      windDown: {
        createAction: (name: string) =>
          runWindDownAction(() => actions.windDown.createAction(name)),
        deleteAction: (actionId: number) =>
          runWindDownAction(() => actions.windDown.deleteAction(actionId)),
        renameAction: (actionId: number, name: string) =>
          runWindDownAction(() =>
            actions.windDown.renameAction(actionId, name)
          ),
        toggleAction: actions.windDown.toggleAction,
      },
    },
    errorMessage,
  };
}
