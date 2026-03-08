import type * as ElectronModule from "electron";

describe("main asset helpers", () => {
  it("resolves mascot assets from the public folder in development", async () => {
    vi.resetModules();
    vi.doMock(
      import("electron"),
      (): Partial<typeof ElectronModule> => ({
        app: {
          getAppPath: () => "/Users/tester/Zucchini",
          isPackaged: false,
        } as ElectronModule.App,
      })
    );

    const { resolveMascotAssetPath, resolveRuntimeIconPath } =
      await import("./assets");

    expect(resolveMascotAssetPath("mascot-reminder.png")).toBe(
      "/Users/tester/Zucchini/public/mascot/mascot-reminder.png"
    );
    expect(resolveRuntimeIconPath()).toBe(
      "/Users/tester/Zucchini/build/icon.png"
    );
  });

  it("resolves mascot assets from the packaged app bundle", async () => {
    vi.resetModules();
    vi.doMock(
      import("electron"),
      (): Partial<typeof ElectronModule> => ({
        app: {
          getAppPath: () =>
            "/Applications/Zucchini.app/Contents/Resources/app.asar",
          isPackaged: true,
        } as ElectronModule.App,
      })
    );

    const { resolveMascotAssetPath, resolveRuntimeIconPath } =
      await import("./assets");

    expect(resolveMascotAssetPath("mascot-sleepy.png")).toBe(
      "/Applications/Zucchini.app/Contents/Resources/app.asar/dist/mascot/mascot-sleepy.png"
    );
    expect(resolveRuntimeIconPath()).toBe(
      "/Applications/Zucchini.app/Contents/Resources/app.asar/build/icon.png"
    );
  });
});
