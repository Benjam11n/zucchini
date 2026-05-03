import type { LoggerPort } from "@/main/app/ports";
import { configureSessionSecurity } from "@/main/app/session-security";

type PermissionCheckHandler = (
  webContents: { getURL(): string } | null,
  permission: string,
  requestingOrigin: string
) => boolean;

type PermissionRequestHandler = (
  webContents: { getURL(): string } | null,
  permission: string,
  callback: (granted: boolean) => void,
  details: { requestingUrl: string }
) => void;

interface SessionSecurityHarness {
  log: LoggerPort;
  permissionCheckHandler: PermissionCheckHandler | null;
  permissionRequestHandler: PermissionRequestHandler | null;
}

describe("configureSessionSecurity()", () => {
  function createHarness(): SessionSecurityHarness {
    let permissionCheckHandler: PermissionCheckHandler | null = null;
    let permissionRequestHandler: PermissionRequestHandler | null = null;
    const log: LoggerPort = {
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    };

    configureSessionSecurity(
      {
        setPermissionCheckHandler(handler) {
          permissionCheckHandler = handler;
        },
        setPermissionRequestHandler(handler) {
          permissionRequestHandler = handler;
        },
      },
      log
    );

    return {
      log,
      permissionCheckHandler,
      permissionRequestHandler,
    };
  }

  it("denies every permission check and logs the attempt", () => {
    const { log, permissionCheckHandler } = createHarness();

    expect(permissionCheckHandler).not.toBeNull();
    if (!permissionCheckHandler) {
      throw new Error("Expected permission check handler to be registered.");
    }

    expect(
      permissionCheckHandler(
        {
          getURL: () => "file:///index.html",
        },
        "notifications",
        "https://example.com"
      )
    ).toBeFalsy();

    expect(log.warn).toHaveBeenCalledWith(
      "Blocked Electron permission check.",
      {
        permission: "notifications",
        rendererUrl: "file:///index.html",
        requestingOrigin: "https://example.com",
      }
    );
  });

  it("denies every permission request and logs the attempt", () => {
    const { log, permissionRequestHandler } = createHarness();
    const callback = vi.fn();

    expect(permissionRequestHandler).not.toBeNull();
    if (!permissionRequestHandler) {
      throw new Error("Expected permission request handler to be registered.");
    }

    permissionRequestHandler(
      {
        getURL: () => "file:///index.html",
      },
      "media",
      callback,
      {
        requestingUrl: "https://example.com/camera",
      }
    );

    expect(callback).toHaveBeenCalledWith(false);
    expect(log.warn).toHaveBeenCalledWith(
      "Blocked Electron permission request.",
      {
        permission: "media",
        rendererUrl: "file:///index.html",
        requestingUrl: "https://example.com/camera",
      }
    );
  });
});
