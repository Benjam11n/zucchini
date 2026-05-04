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

const PRODUCTION_APP_URL = "file:///app/index.html";
const PRODUCTION_WIDGET_URL = "file:///app/index.html?view=widget";

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
  function createHarness(
    productionAppUrl = PRODUCTION_APP_URL
  ): WindowSecurityHarness {
    let windowOpenHandler: WindowOpenHandler | null = null;
    let willNavigateHandler: WillNavigateHandler | null = null;

    configureWindowSecurity(
      {
        webContents: {
          on(_event: string, handler: WillNavigateHandler) {
            willNavigateHandler = handler;
          },
          setWindowOpenHandler(handler: WindowOpenHandler) {
            windowOpenHandler = handler;
          },
        },
      } as never,
      { productionAppUrl }
    );

    return { willNavigateHandler, windowOpenHandler };
  }

  function getWillNavigateHandler(
    productionAppUrl = PRODUCTION_APP_URL
  ): WillNavigateHandler {
    const { willNavigateHandler } = createHarness(productionAppUrl);

    expect(willNavigateHandler).not.toBeNull();
    if (!willNavigateHandler) {
      throw new Error("Expected will-navigate handler to be registered.");
    }

    return willNavigateHandler;
  }

  function navigateTo(url: string, productionAppUrl = PRODUCTION_APP_URL) {
    const event = { preventDefault: vi.fn() };
    getWillNavigateHandler(productionAppUrl)(event, url);
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

  it("allows navigation to the packaged production app URL", () => {
    withDevServerUrl(null, () => {
      const event = navigateTo(PRODUCTION_APP_URL);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  it("allows navigation to the packaged widget URL for widget windows", () => {
    withDevServerUrl(null, () => {
      const event = navigateTo(PRODUCTION_WIDGET_URL, PRODUCTION_WIDGET_URL);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  it("blocks navigation to other file:// URLs in production", () => {
    withDevServerUrl(null, () => {
      const event = navigateTo("file:///tmp/attacker.html");

      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  it("blocks navigation from the main window to the widget URL in production", () => {
    withDevServerUrl(null, () => {
      const event = navigateTo(PRODUCTION_WIDGET_URL);

      expect(event.preventDefault).toHaveBeenCalled();
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
