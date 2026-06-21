import type { LoggerPort, SessionSecurityPort } from "@/main/app/ports";

type PermissionWebContents = { getURL: () => string } | null;

export function configureSessionSecurity(
  session: SessionSecurityPort,
  log: Pick<LoggerPort, "warn">
): void {
  session.setPermissionCheckHandler(
    (webContents: PermissionWebContents, permission, requestingOrigin) => {
      log.warn("Blocked Electron permission check.", {
        permission,
        rendererUrl: webContents?.getURL() ?? null,
        requestingOrigin,
      });

      return false;
    }
  );

  session.setPermissionRequestHandler(
    (webContents, permission, callback, details) => {
      log.warn("Blocked Electron permission request.", {
        permission,
        rendererUrl: webContents?.getURL() ?? null,
        requestingUrl: details.requestingUrl,
      });
      // Electron requires a synchronous callback decision for permission prompts.
      const denyPermission = callback;
      denyPermission(false);
    }
  );
}
