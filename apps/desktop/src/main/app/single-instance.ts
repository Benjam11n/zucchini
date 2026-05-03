/**
 * Single-instance lock enforcement.
 *
 * Ensures only one instance of Zucchini runs at a time. If a second instance
 * is launched, it forwards the focus event to the existing instance instead
 * of starting a new window.
 */
import type {
  SecondInstanceAppPort,
  SingleInstanceLockAppPort,
} from "@/main/app/ports";

export function acquireSingleInstanceLock(
  app: SingleInstanceLockAppPort
): boolean {
  return app.requestSingleInstanceLock();
}

export function registerSecondInstanceHandler(
  app: SecondInstanceAppPort,
  showMainWindow: () => void
): void {
  app.on("second-instance", () => {
    showMainWindow();
  });
}
