import { createMainWindow } from "@/main/app/windows/main-window";

import { WindowCoordinator } from "./window-coordinator";

vi.mock("@/main/app/window-theme", () => ({
  applyWindowThemeMode: vi.fn(),
  getWindowBackgroundColor: () => "#000000",
}));
vi.mock("@/main/app/assets", () => ({ resolveRuntimeIconPath: vi.fn() }));
vi.mock("@/main/app/windows/main-window", () => ({
  createMainWindow: vi.fn(() => ({ isDestroyed: () => false })),
}));

describe("main window close", () => {
  const originalPlatform = process.platform;

  afterEach(() => {
    Object.defineProperty(process, "platform", { value: originalPlatform });
    vi.clearAllMocks();
  });

  it.each([
    ["win32", false, true],
    ["linux", false, true],
    ["darwin", false, false],
    ["win32", true, false],
  ] as const)(
    "handles %s with tray %s",
    (platform, trayEnabled, shouldQuit) => {
      Object.defineProperty(process, "platform", { value: platform });
      const quit = vi.fn();
      const coordinator = new WindowCoordinator({
        getIsQuitting: () => false,
        getTrayEnabled: () => trayEnabled,
        quit,
      });
      coordinator.ensureMainWindow();
      const [call] = vi.mocked(createMainWindow).mock.calls;
      expect(call).toBeDefined();
      call?.[0].onClosed();
      expect(quit).toHaveBeenCalledTimes(shouldQuit ? 1 : 0);
    }
  );
});
