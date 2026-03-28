import { FOCUS_TIMER_SHORTCUT_DEFAULTS } from "@/shared/contracts/keyboard-shortcuts";
import { createDefaultAppSettings } from "@/shared/domain/settings";

import {
  buildLoginItemSettings,
  shouldHideOnWindowClose,
  shouldQuitWhenAllWindowsClosed,
} from "./lifecycle";

describe("buildLoginItemSettings()", () => {
  it("disables launch at login when the setting is off", () => {
    expect(
      buildLoginItemSettings({
        ...createDefaultAppSettings("Asia/Singapore"),
        launchAtLogin: false,
        minimizeToTray: true,
        resetFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
        toggleFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
      })
    ).toStrictEqual({
      openAsHidden: true,
      openAtLogin: false,
    });
  });

  it("hides on launch when tray mode is enabled", () => {
    expect(
      buildLoginItemSettings({
        ...createDefaultAppSettings("Asia/Singapore"),
        launchAtLogin: true,
        minimizeToTray: true,
        resetFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.reset,
        toggleFocusTimerShortcut: FOCUS_TIMER_SHORTCUT_DEFAULTS.darwin.toggle,
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
    ).toBeFalsy();
  });

  it("returns false while the app is quitting", () => {
    expect(
      shouldHideOnWindowClose({
        isQuitting: true,
        trayEnabled: true,
      })
    ).toBeFalsy();
  });

  it("returns true when tray mode is enabled and the app is not quitting", () => {
    expect(
      shouldHideOnWindowClose({
        isQuitting: false,
        trayEnabled: true,
      })
    ).toBeTruthy();
  });
});

describe("shouldQuitWhenAllWindowsClosed()", () => {
  it("returns false when tray mode is enabled", () => {
    expect(
      shouldQuitWhenAllWindowsClosed({
        platform: "linux",
        trayEnabled: true,
      })
    ).toBeFalsy();
  });

  it("returns false on macOS when tray mode is disabled", () => {
    expect(
      shouldQuitWhenAllWindowsClosed({
        platform: "darwin",
        trayEnabled: false,
      })
    ).toBeFalsy();
  });

  it("returns true on non-macOS when tray mode is disabled", () => {
    expect(
      shouldQuitWhenAllWindowsClosed({
        platform: "win32",
        trayEnabled: false,
      })
    ).toBeTruthy();
  });
});
