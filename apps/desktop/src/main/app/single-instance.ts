/**
 * Single-instance lock enforcement.
 *
 * Ensures only one instance of Zucchini runs at a time. If a second instance
 * is launched, it forwards the focus event to the existing instance instead
 * of starting a new window.
 */
interface SingleInstanceLockAppLike {
  requestSingleInstanceLock(): boolean;
}

interface SecondInstanceAppLike {
  on(event: "second-instance", listener: () => void): void;
}

export function acquireSingleInstanceLock(
  appLike: SingleInstanceLockAppLike
): boolean {
  return appLike.requestSingleInstanceLock();
}

export function registerSecondInstanceHandler(
  appLike: SecondInstanceAppLike,
  showMainWindow: () => void
): void {
  appLike.on("second-instance", () => {
    showMainWindow();
  });
}
