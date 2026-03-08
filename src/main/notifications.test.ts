import type * as ElectronModule from "electron";

import type * as AssetsModule from "./assets";
import {
  showCatchUpReminder,
  showIncompleteReminder,
  showMidnightWarning,
  showMissedReminderWarning,
  showSnoozedReminder,
} from "./notifications";

const notificationState = vi.hoisted(() => ({
  lastNotification: null as null | {
    body: string;
    icon: { empty: boolean; path: string } | undefined;
    title: string;
  },
  supported: true,
  throwOnShow: false,
}));

vi.mock<typeof ElectronModule>(import("electron"), () => ({
  Notification: class {
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
  } as unknown as typeof ElectronModule.Notification,
  nativeImage: {
    createFromPath: (assetPath: string) => ({
      empty: false,
      isEmpty: () => false,
      path: assetPath,
    }),
  } as unknown as typeof ElectronModule.nativeImage,
}));

vi.mock<typeof AssetsModule>(import("./assets"), () => ({
  resolveMascotAssetPath: (filename: string) => `/mocked/${filename}`,
}));

describe("notifications", () => {
  beforeEach(() => {
    notificationState.throwOnShow = false;
  });

  it("uses the reminder mascot for incomplete reminders", () => {
    notificationState.lastNotification = null;
    notificationState.supported = true;
    showIncompleteReminder();

    expect(notificationState.lastNotification).toMatchObject({
      body: "You still have habits closing today.",
      icon: {
        empty: false,
        path: "/mocked/mascot-reminder.png",
      },
      title: "Zucchini reminder",
    });
  });

  it("uses the sleepy mascot for midnight warnings", () => {
    notificationState.lastNotification = null;
    notificationState.supported = true;
    showMidnightWarning();

    expect(notificationState.lastNotification).toMatchObject({
      body: "You have 1 hour left to finish habits closing today.",
      icon: {
        empty: false,
        path: "/mocked/mascot-sleepy.png",
      },
      title: "One hour left",
    });
  });

  it("shows a catch-up reminder when the scheduled reminder was missed", () => {
    notificationState.lastNotification = null;
    notificationState.supported = true;
    showCatchUpReminder();

    expect(notificationState.lastNotification).toMatchObject({
      body: "Zucchini was closed at your reminder time. You still have habits closing today.",
      icon: {
        empty: false,
        path: "/mocked/mascot-reminder.png",
      },
      title: "Catch-up reminder",
    });
  });

  it("shows the missed reminder warning with the sleepy mascot", () => {
    notificationState.lastNotification = null;
    notificationState.supported = true;
    showMissedReminderWarning();

    expect(notificationState.lastNotification).toMatchObject({
      body: "You missed today's scheduled reminder. You still have habits closing today, and there is only one hour left.",
      icon: {
        empty: false,
        path: "/mocked/mascot-sleepy.png",
      },
      title: "Last reminder missed",
    });
  });

  it("includes the snooze duration in snoozed reminders", () => {
    notificationState.lastNotification = null;
    notificationState.supported = true;
    showSnoozedReminder(15);

    expect(notificationState.lastNotification).toMatchObject({
      body: "Your 15-minute Zucchini snooze has ended. You still have habits closing today.",
      icon: {
        empty: false,
        path: "/mocked/mascot-reminder.png",
      },
      title: "Snooze finished",
    });
  });

  it("does not show notifications when the platform does not support them", () => {
    notificationState.lastNotification = null;
    notificationState.supported = false;

    showIncompleteReminder();

    expect(notificationState.lastNotification).toBeNull();
  });

  it("swallows notification show failures", () => {
    notificationState.lastNotification = null;
    notificationState.supported = true;
    notificationState.throwOnShow = true;

    expect(() => showIncompleteReminder()).not.toThrow();
    expect(notificationState.lastNotification).toBeNull();
  });
});
