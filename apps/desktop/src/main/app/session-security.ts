import type { LoggerLike } from "@/main/app/logger";

interface PermissionWebContentsLike {
  getURL(): string;
}

interface SessionLike {
  setPermissionCheckHandler(
    handler: (
      webContents: PermissionWebContentsLike | null,
      permission: string,
      requestingOrigin: string
    ) => boolean
  ): void;
  setPermissionRequestHandler(
    handler: (
      webContents: PermissionWebContentsLike | null,
      permission: string,
      callback: (granted: boolean) => void,
      details: {
        requestingUrl: string;
      }
    ) => void
  ): void;
}

export function configureSessionSecurity(
  sessionLike: SessionLike,
  log: LoggerLike
): void {
  sessionLike.setPermissionCheckHandler(
    (webContents, permission, requestingOrigin) => {
      log.warn("Blocked Electron permission check.", {
        permission,
        rendererUrl: webContents?.getURL() ?? null,
        requestingOrigin,
      });

      return false;
    }
  );

  sessionLike.setPermissionRequestHandler(
    (webContents, permission, callback, details) => {
      log.warn("Blocked Electron permission request.", {
        permission,
        rendererUrl: webContents?.getURL() ?? null,
        requestingUrl: details.requestingUrl,
      });
      // Electron requires a synchronous callback decision for permission prompts.
      // oxlint-disable-next-line eslint-plugin-promise(prefer-await-to-callbacks)
      callback(false);
    }
  );
}
