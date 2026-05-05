import type * as ElectronModule from "electron";

import type * as NativeAddonModule from "./native-addon";
import {
  getDesktopNotificationStatus,
  showCatchUpReminder,
  showIncompleteReminder,
  showMidnightWarning,
  showMissedReminderWarning,
  showSnoozedReminder,
} from "./notifications";

type ElectronExports = typeof ElectronModule;

type MacNotificationState =
  | "DO_NOT_DISTURB"
  | "SESSION_ON_CONSOLE_KEY"
  | "SESSION_SCREEN_IS_LOCKED"
  | "UNKNOWN"
  | "UNKNOWN_ERROR";

type WindowsNotificationState =
  | "QUNS_ACCEPTS_NOTIFICATIONS"
  | "QUNS_APP"
  | "QUNS_BUSY"
  | "QUNS_NOT_PRESENT"
  | "QUNS_PRESENTATION_MODE"
  | "QUNS_QUIET_TIME"
  | "QUNS_RUNNING_D3D_FULL_SCREEN"
  | "UNKNOWN_ERROR";

interface MacNotificationStateModule {
  getNotificationState: () => Promise<MacNotificationState>;
}

interface WindowsNotificationStateModule {
  getNotificationState: () => WindowsNotificationState;
}

const notificationState = vi.hoisted(() => ({
  lastNotification: null as null | {
    body: string;
    icon: { empty: boolean; path: string } | undefined;
    title: string;
  },
  supported: true,
  throwOnShow: false,
}));

const macNotificationState = vi.hoisted(() => ({
  current: "SESSION_ON_CONSOLE_KEY" as MacNotificationState,
  throwOnRead: false,
}));

const windowsNotificationState = vi.hoisted(() => ({
  current: "QUNS_ACCEPTS_NOTIFICATIONS" as WindowsNotificationState,
  throwOnRead: false,
}));

const nativeAddonState = vi.hoisted(() => ({
  macosAvailable: true,
  windowsAvailable: true,
}));

vi.mock("electron", async (importOriginal) => {
  const actual = (await importOriginal()) as ElectronExports;

  return {
    ...actual,
    Notification: Object.assign(
      class {
        static isSupported(): boolean {
          return notificationState.supported;
        }

        private readonly options: {
          body: string;
          icon?: { empty: boolean; path: string };
          title: string;
        };

        constructor(options: {
          body: string;
          icon?: { empty: boolean; path: string };
          title: string;
        }) {
          this.options = options;
        }

        show(): void {
          if (notificationState.throwOnShow) {
            throw new Error("notification denied");
          }

          notificationState.lastNotification = {
            body: this.options.body,
            icon: this.options.icon,
            title: this.options.title,
          };
        }
      },
      actual.Notification
    ),
    app: {
      ...actual.app,
      getAppPath: () => "/mocked",
      isPackaged: false,
    },
    nativeImage: {
      ...actual.nativeImage,
      createFromPath: (assetPath: string) => ({
        empty: false,
        isEmpty: () => false,
        path: assetPath,
      }),
    },
  };
});

vi.mock<MacNotificationStateModule>(import("macos-notification-state"), () => ({
  getNotificationState: () => {
    if (macNotificationState.throwOnRead) {
      throw new Error("mac notification state unavailable");
    }

    return Promise.resolve(macNotificationState.current);
  },
}));

vi.mock<WindowsNotificationStateModule>(
  import("windows-notification-state"),
  () => ({
    getNotificationState: () => {
      if (windowsNotificationState.throwOnRead) {
        throw new Error("windows notification state unavailable");
      }

      return windowsNotificationState.current;
    },
  })
);

vi.mock<typeof NativeAddonModule>(import("./native-addon"), () => ({
  hasNativeAddonBinary: ({ packageName }: { packageName: string }) => {
    if (packageName === "macos-notification-state") {
      return nativeAddonState.macosAvailable;
    }

    if (packageName === "windows-notification-state") {
      return nativeAddonState.windowsAvailable;
    }

    return false;
  },
}));

const originalPlatform = process.platform;
const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

function setPlatform(platform: NodeJS.Platform): void {
  Object.defineProperty(process, "platform", {
    configurable: true,
    value: platform,
  });
}

function resetState(): void {
  notificationState.lastNotification = null;
  notificationState.supported = true;
  notificationState.throwOnShow = false;
  macNotificationState.current = "SESSION_ON_CONSOLE_KEY";
  macNotificationState.throwOnRead = false;
  windowsNotificationState.current = "QUNS_ACCEPTS_NOTIFICATIONS";
  windowsNotificationState.throwOnRead = false;
  nativeAddonState.macosAvailable = true;
  nativeAddonState.windowsAvailable = true;
  consoleWarn.mockClear();
  setPlatform(originalPlatform);
}

describe("notifications", () => {
  it("uses the reminder mascot for incomplete reminders", () => {
    resetState();
    showIncompleteReminder();

    expect(notificationState.lastNotification).toMatchObject({
      body: "You still have habits closing today.",
      icon: {
        empty: false,
        path: "/mocked/public/mascot/mascot-reminder.png",
      },
      title: "Zucchini reminder",
    });
  });

  it("uses the sleepy mascot for midnight warnings", () => {
    resetState();
    showMidnightWarning();

    expect(notificationState.lastNotification).toMatchObject({
      body: "You have 1 hour left to finish habits closing today.",
      icon: {
        empty: false,
        path: "/mocked/public/mascot/mascot-sleepy.png",
      },
      title: "One hour left",
    });
  });

  it("shows a catch-up reminder when the scheduled reminder was missed", () => {
    resetState();
    showCatchUpReminder();

    expect(notificationState.lastNotification).toMatchObject({
      body: "Zucchini was closed at your reminder time. You still have habits closing today.",
      icon: {
        empty: false,
        path: "/mocked/public/mascot/mascot-reminder.png",
      },
      title: "Catch-up reminder",
    });
  });

  it("shows the missed reminder warning with the sleepy mascot", () => {
    resetState();
    showMissedReminderWarning();

    expect(notificationState.lastNotification).toMatchObject({
      body: "You missed today's scheduled reminder. You still have habits closing today, and there is only one hour left.",
      icon: {
        empty: false,
        path: "/mocked/public/mascot/mascot-sleepy.png",
      },
      title: "Last reminder missed",
    });
  });

  it("includes the snooze duration in snoozed reminders", () => {
    resetState();
    showSnoozedReminder(15);

    expect(notificationState.lastNotification).toMatchObject({
      body: "Your 15-minute Zucchini snooze has ended. You still have habits closing today.",
      icon: {
        empty: false,
        path: "/mocked/public/mascot/mascot-reminder.png",
      },
      title: "Snooze finished",
    });
  });

  it("does not show notifications when the platform does not support them", () => {
    resetState();
    notificationState.supported = false;

    showIncompleteReminder();

    expect(notificationState.lastNotification).toBeNull();
  });

  it("swallows notification show failures", () => {
    resetState();
    notificationState.throwOnShow = true;

    expect(() => showIncompleteReminder()).not.toThrow();
    expect(notificationState.lastNotification).toBeNull();
  });

  it("returns unsupported when desktop notifications are not supported", async () => {
    resetState();
    notificationState.supported = false;

    await expect(getDesktopNotificationStatus()).resolves.toStrictEqual({
      availability: "unsupported",
      reason: "unsupported-platform",
    });
  });

  it("maps macOS do not disturb to a blocked status", async () => {
    resetState();
    setPlatform("darwin");
    macNotificationState.current = "DO_NOT_DISTURB";

    await expect(getDesktopNotificationStatus()).resolves.toStrictEqual({
      availability: "blocked",
      reason: "do-not-disturb",
    });
  });

  it("maps macOS active console sessions to available", async () => {
    resetState();
    setPlatform("darwin");
    macNotificationState.current = "SESSION_ON_CONSOLE_KEY";

    await expect(getDesktopNotificationStatus()).resolves.toStrictEqual({
      availability: "available",
      reason: null,
    });
  });

  it("maps macOS lookup failures to unknown", async () => {
    resetState();
    setPlatform("darwin");
    macNotificationState.throwOnRead = true;

    await expect(getDesktopNotificationStatus()).resolves.toStrictEqual({
      availability: "unknown",
      reason: "platform-error",
    });
  });

  it("warns and falls back when the macOS native addon is missing", async () => {
    resetState();
    setPlatform("darwin");
    nativeAddonState.macosAvailable = false;

    await expect(getDesktopNotificationStatus()).resolves.toStrictEqual({
      availability: "unknown",
      reason: "platform-error",
    });
    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining(
        'Native addon "macos-notification-state" is unavailable'
      )
    );
  });

  it("maps Windows quiet time to a blocked status", async () => {
    resetState();
    setPlatform("win32");
    windowsNotificationState.current = "QUNS_QUIET_TIME";

    await expect(getDesktopNotificationStatus()).resolves.toStrictEqual({
      availability: "blocked",
      reason: "quiet-time",
    });
  });

  it("maps Windows accepts notifications to available", async () => {
    resetState();
    setPlatform("win32");
    windowsNotificationState.current = "QUNS_ACCEPTS_NOTIFICATIONS";

    await expect(getDesktopNotificationStatus()).resolves.toStrictEqual({
      availability: "available",
      reason: null,
    });
  });

  it("maps Windows lookup failures to unknown", async () => {
    resetState();
    setPlatform("win32");
    windowsNotificationState.throwOnRead = true;

    await expect(getDesktopNotificationStatus()).resolves.toStrictEqual({
      availability: "unknown",
      reason: "platform-error",
    });
  });

  it("warns and falls back when the Windows native addon is missing", async () => {
    resetState();
    setPlatform("win32");
    nativeAddonState.windowsAvailable = false;

    await expect(getDesktopNotificationStatus()).resolves.toStrictEqual({
      availability: "unknown",
      reason: "platform-error",
    });
    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining(
        'Native addon "windows-notification-state" is unavailable'
      )
    );
  });

  it("returns unsupported on Linux", async () => {
    resetState();
    setPlatform("linux");

    await expect(getDesktopNotificationStatus()).resolves.toStrictEqual({
      availability: "unsupported",
      reason: "unsupported-platform",
    });
  });
});
