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
