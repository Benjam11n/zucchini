import type * as ElectronModule from "electron";

import type * as AssetsModule from "./assets";
import { showIncompleteReminder, showMidnightWarning } from "./notifications";

const notificationState = vi.hoisted(() => ({
  lastNotification: null as null | {
    body: string;
    icon: { empty: boolean; path: string } | undefined;
    title: string;
  },
  supported: true,
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

  it("does not show notifications when the platform does not support them", () => {
    notificationState.lastNotification = null;
    notificationState.supported = false;

    showIncompleteReminder();

    expect(notificationState.lastNotification).toBeNull();
  });
});
