import {
  readJsonStorage,
  removeStorage,
  STORAGE_KEYS,
  writeJsonStorage,
} from "@/renderer/shared/lib/storage";

interface PersistedUpdateToastState {
  dismissedVersion: string | null;
}

function isPersistedUpdateToastState(
  value: unknown
): value is PersistedUpdateToastState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PersistedUpdateToastState>;
  return (
    candidate.dismissedVersion === null ||
    typeof candidate.dismissedVersion === "string"
  );
}

export function readDismissedUpdateVersion(): string | null {
  const parsedValue = readJsonStorage(STORAGE_KEYS.updateToastDismissal);
  return isPersistedUpdateToastState(parsedValue)
    ? parsedValue.dismissedVersion
    : null;
}

export function writeDismissedUpdateVersion(version: string): void {
  writeJsonStorage(STORAGE_KEYS.updateToastDismissal, {
    dismissedVersion: version,
  } satisfies PersistedUpdateToastState);
}

export function clearDismissedUpdateVersion(): void {
  removeStorage(STORAGE_KEYS.updateToastDismissal);
}
