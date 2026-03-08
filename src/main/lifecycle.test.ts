import {
  buildLoginItemSettings,
  shouldHideOnWindowClose,
  shouldQuitWhenAllWindowsClosed,
} from "./lifecycle";

describe("buildLoginItemSettings()", () => {
  it("disables launch at login when the setting is off", () => {
    expect(
      buildLoginItemSettings({
        launchAtLogin: false,
        minimizeToTray: true,
        reminderEnabled: true,
        reminderSnoozeMinutes: 15,
        reminderTime: "20:30",
        themeMode: "system",
        timezone: "Asia/Singapore",
      })
    ).toStrictEqual({
      openAsHidden: true,
      openAtLogin: false,
    });
  });

  it("hides on launch when tray mode is enabled", () => {
    expect(
      buildLoginItemSettings({
        launchAtLogin: true,
        minimizeToTray: true,
        reminderEnabled: true,
        reminderSnoozeMinutes: 15,
        reminderTime: "20:30",
        themeMode: "system",
        timezone: "Asia/Singapore",
      })
    ).toStrictEqual({
      openAsHidden: true,
      openAtLogin: true,
    });
  });
});

describe("shouldHideOnWindowClose()", () => {
  it("returns false when tray mode is disabled", () => {
    expect(
      shouldHideOnWindowClose({
        isQuitting: false,
        trayEnabled: false,
      })
    ).toBe(false);
  });

  it("returns false while the app is quitting", () => {
    expect(
      shouldHideOnWindowClose({
        isQuitting: true,
        trayEnabled: true,
      })
    ).toBe(false);
  });

  it("returns true when tray mode is enabled and the app is not quitting", () => {
    expect(
      shouldHideOnWindowClose({
        isQuitting: false,
        trayEnabled: true,
      })
    ).toBe(true);
  });
});

describe("shouldQuitWhenAllWindowsClosed()", () => {
  it("returns false when tray mode is enabled", () => {
    expect(
      shouldQuitWhenAllWindowsClosed({
        platform: "linux",
        trayEnabled: true,
      })
    ).toBe(false);
  });

  it("returns false on macOS when tray mode is disabled", () => {
    expect(
      shouldQuitWhenAllWindowsClosed({
        platform: "darwin",
        trayEnabled: false,
      })
    ).toBe(false);
  });

  it("returns true on non-macOS when tray mode is disabled", () => {
    expect(
      shouldQuitWhenAllWindowsClosed({
        platform: "win32",
        trayEnabled: false,
      })
    ).toBe(true);
  });
});
