import { useState } from "react";

import type { WindDownPageActions } from "@/renderer/features/wind-down/wind-down.types";
import { useAppIpcActionRunner } from "@/renderer/shared/hooks/use-app-ipc-action-runner";

export function useWindDownController(actions: WindDownPageActions) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const runWindDownAction = useAppIpcActionRunner({
    onError: setErrorMessage,
    onSuccess: () => setErrorMessage(null),
  });

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
