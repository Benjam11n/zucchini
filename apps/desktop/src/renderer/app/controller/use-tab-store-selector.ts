/**
 * Tab-aware Zustand store selector hook.
 *
 * Returns `null` when the specified tab is not active, allowing the store
 * subscription to skip re-renders for invisible tabs. Uses `useShallow` to
 * prevent unnecessary updates when the selected value is referentially stable.
 */
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
