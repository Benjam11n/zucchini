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

  it("denies all new window open requests", () => {
    const { windowOpenHandler } = createHarness();

    expect(windowOpenHandler).not.toBeNull();
    if (!windowOpenHandler) {
      throw new Error("Expected window open handler to be registered.");
    }

    expect(windowOpenHandler()).toStrictEqual({ action: "deny" });
  });

  it("allows navigation to the Vite dev server URL", () => {
    const originalEnv = process.env["VITE_DEV_SERVER_URL"];
    process.env["VITE_DEV_SERVER_URL"] = "http://localhost:5173";

    try {
      const { willNavigateHandler } = createHarness();

      expect(willNavigateHandler).not.toBeNull();
      if (!willNavigateHandler) {
        throw new Error("Expected will-navigate handler to be registered.");
      }

      const event = { preventDefault: vi.fn() };
      willNavigateHandler(event, "http://localhost:5173/index.html");

      expect(event.preventDefault).not.toHaveBeenCalled();
    } finally {
      process.env["VITE_DEV_SERVER_URL"] = originalEnv;
    }
  });

  it("allows navigation to file:// URLs", () => {
    const originalEnv = process.env["VITE_DEV_SERVER_URL"];
    delete process.env["VITE_DEV_SERVER_URL"];

    try {
      const { willNavigateHandler } = createHarness();

      expect(willNavigateHandler).not.toBeNull();
      if (!willNavigateHandler) {
        throw new Error("Expected will-navigate handler to be registered.");
      }

      const event = { preventDefault: vi.fn() };
      willNavigateHandler(event, "file:///app/index.html");

      expect(event.preventDefault).not.toHaveBeenCalled();
    } finally {
      process.env["VITE_DEV_SERVER_URL"] = originalEnv;
    }
  });

  it("blocks navigation to untrusted external URLs", () => {
    const { willNavigateHandler } = createHarness();

    expect(willNavigateHandler).not.toBeNull();
    if (!willNavigateHandler) {
      throw new Error("Expected will-navigate handler to be registered.");
    }

    const event = { preventDefault: vi.fn() };
    willNavigateHandler(event, "https://malicious.example.com/phish");

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("blocks navigation to data:// URLs", () => {
    const { willNavigateHandler } = createHarness();

    expect(willNavigateHandler).not.toBeNull();
    if (!willNavigateHandler) {
      throw new Error("Expected will-navigate handler to be registered.");
    }

    const event = { preventDefault: vi.fn() };
    willNavigateHandler(event, "data:text/html,<script>alert(1)</script>");

    expect(event.preventDefault).toHaveBeenCalled();
  });
});
