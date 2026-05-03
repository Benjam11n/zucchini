import { configureWindowSecurity } from "@/main/app/windows/window-security";

type WindowOpenHandler = () => { action: "deny" };
type WillNavigateHandler = (
  event: { preventDefault: () => void },
  url: string
) => void;

interface WindowSecurityHarness {
  windowOpenHandler: WindowOpenHandler | null;
  willNavigateHandler: WillNavigateHandler | null;
}

function withDevServerUrl(url: string | null, run: () => void) {
  const originalEnv = process.env["VITE_DEV_SERVER_URL"];

  if (url === null) {
    delete process.env["VITE_DEV_SERVER_URL"];
  } else {
    process.env["VITE_DEV_SERVER_URL"] = url;
  }

  try {
    run();
  } finally {
    process.env["VITE_DEV_SERVER_URL"] = originalEnv;
  }
}

describe("configureWindowSecurity()", () => {
  function createHarness(): WindowSecurityHarness {
    let windowOpenHandler: WindowOpenHandler | null = null;
    let willNavigateHandler: WillNavigateHandler | null = null;

    configureWindowSecurity({
      webContents: {
        on(_event: string, handler: WillNavigateHandler) {
          willNavigateHandler = handler;
        },
        setWindowOpenHandler(handler: WindowOpenHandler) {
          windowOpenHandler = handler;
        },
      },
    } as never);

    return { willNavigateHandler, windowOpenHandler };
  }

  function getWillNavigateHandler(): WillNavigateHandler {
    const { willNavigateHandler } = createHarness();

    expect(willNavigateHandler).not.toBeNull();
    if (!willNavigateHandler) {
      throw new Error("Expected will-navigate handler to be registered.");
    }

    return willNavigateHandler;
  }

  function navigateTo(url: string) {
    const event = { preventDefault: vi.fn() };
    getWillNavigateHandler()(event, url);
    return event;
  }

  it("denies all new window open requests", () => {
    const { windowOpenHandler } = createHarness();

    expect(windowOpenHandler).not.toBeNull();
    if (!windowOpenHandler) {
      throw new Error("Expected window open handler to be registered.");
    }

    expect(windowOpenHandler()).toStrictEqual({ action: "deny" });
  });

  it("allows navigation to the Vite dev server URL", () => {
    withDevServerUrl("http://localhost:5173", () => {
      const event = navigateTo("http://localhost:5173/index.html");

      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  it("allows navigation to file:// URLs", () => {
    withDevServerUrl(null, () => {
      const event = navigateTo("file:///app/index.html");

      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  it("blocks navigation to untrusted external URLs", () => {
    const event = navigateTo("https://malicious.example.com/phish");

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("blocks navigation to data:// URLs", () => {
    const event = navigateTo("data:text/html,<script>alert(1)</script>");

    expect(event.preventDefault).toHaveBeenCalled();
  });
});
