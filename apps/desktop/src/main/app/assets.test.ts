import path from "node:path";

import type * as ElectronModule from "electron";

describe("main asset helpers", () => {
  it("resolves mascot assets from the public folder in development", async () => {
    const appPath = "/Users/tester/Zucchini";

    vi.resetModules();
    vi.doMock(
      import("electron"),
      (): Partial<typeof ElectronModule> => ({
        app: {
          getAppPath: () => appPath,
          isPackaged: false,
        } as ElectronModule.App,
      })
    );

    const { resolveMascotAssetPath, resolveRuntimeIconPath } =
      await import("./assets");

    expect(resolveMascotAssetPath("mascot-reminder.png")).toBe(
      path.join(appPath, "public", "mascot", "mascot-reminder.png")
    );
    expect(resolveRuntimeIconPath()).toBe(
      path.join(appPath, "build", "icon.png")
    );
  });

  it("resolves mascot assets from the packaged app bundle", async () => {
    const appPath = "/Applications/Zucchini.app/Contents/Resources/app.asar";

    vi.resetModules();
    vi.doMock(
      import("electron"),
      (): Partial<typeof ElectronModule> => ({
        app: {
          getAppPath: () => appPath,
          isPackaged: true,
        } as ElectronModule.App,
      })
    );

    const { resolveMascotAssetPath, resolveRuntimeIconPath } =
      await import("./assets");

    expect(resolveMascotAssetPath("mascot-sleepy.png")).toBe(
      path.join(appPath, "dist", "mascot", "mascot-sleepy.png")
    );
    expect(resolveRuntimeIconPath()).toBe(
      path.join(appPath, "build", "icon.png")
    );
  });
});
