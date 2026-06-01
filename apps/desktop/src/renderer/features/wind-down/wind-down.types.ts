export interface WindDownPageActions {
  windDown: {
    createAction: (name: string) => Promise<void>;
    deleteAction: (actionId: number) => Promise<void>;
    renameAction: (actionId: number, name: string) => Promise<void>;
    toggleAction: (actionId: number) => void;
  };
}
