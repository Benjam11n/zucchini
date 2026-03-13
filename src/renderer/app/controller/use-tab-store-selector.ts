import type { StoreApi, UseBoundStore } from "zustand";
import { useShallow } from "zustand/react/shallow";

import type { AppTab } from "@/renderer/app/app.types";
import { useUiStore } from "@/renderer/app/state/ui-store";

export function useTabStoreSelector<TState extends object, TResult>(
  tabName: AppTab,
  useStore: UseBoundStore<StoreApi<TState>>,
  selector: (state: TState) => TResult
): TResult | null {
  const tab = useUiStore((state) => state.tab);

  return useStore(
    useShallow((state: TState) => (tab === tabName ? selector(state) : null))
  );
}
