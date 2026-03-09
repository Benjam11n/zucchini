import {
  createReminderDraft,
  createStarterPackDrafts,
  getStarterPackSummaryOptions,
  hasStarterPackHabits,
  removeStarterPackHabitDraft,
  resolveOnboardingSettings,
  toStarterPackHabits,
  updateStarterPackHabitDraft,
} from "./utils";

describe("onboarding utils", () => {
  const baseSettings = {
    launchAtLogin: false,
    minimizeToTray: false,
    reminderEnabled: true,
    reminderSnoozeMinutes: 15,
    reminderTime: "20:30",
    themeMode: "system" as const,
    timezone: "Asia/Singapore",
  };

  it("creates editable drafts from a starter pack", () => {
    expect(
      toStarterPackHabits(createStarterPackDrafts("morning-routine"))
    ).toStrictEqual([
      {
        category: "productivity",
        frequency: "daily",
        name: "Make bed",
      },
      {
        category: "nutrition",
        frequency: "daily",
        name: "Drink water after waking",
      },
      {
        category: "fitness",
        frequency: "daily",
        name: "Stretch for 5 minutes",
      },
      {
        category: "productivity",
        frequency: "daily",
        name: "Plan top 3 tasks",
      },
    ]);
  });

  it("updates and removes starter-pack habits", () => {
    const drafts = createStarterPackDrafts("focus-system");
    const updatedDrafts = updateStarterPackHabitDraft(drafts, 0, {
      ...drafts[0]!,
      name: "No-phone work block",
    });

    expect(updatedDrafts[0]?.name).toBe("No-phone work block");
    expect(updatedDrafts[0]?.draftId).toBe(drafts[0]?.draftId);
    expect(removeStarterPackHabitDraft(updatedDrafts, 0)).toHaveLength(3);
  });

  it("detects when no starter-pack habits remain", () => {
    expect(hasStarterPackHabits([])).toBeFalsy();
    expect(
      hasStarterPackHabits([
        {
          name: "  ",
        },
      ])
    ).toBeFalsy();
  });

  it("validates onboarding reminder settings", () => {
    expect(
      resolveOnboardingSettings(baseSettings, {
        reminderEnabled: true,
        reminderTime: "21:15",
        timezone: "America/New_York",
      })
    ).toStrictEqual({
      fieldErrors: {},
      settings: {
        ...baseSettings,
        reminderTime: "21:15",
        timezone: "America/New_York",
      },
    });

    expect(
      resolveOnboardingSettings(baseSettings, {
        reminderEnabled: true,
        reminderTime: "99:00",
        timezone: "Asia/Singapore",
      }).fieldErrors
    ).toStrictEqual({
      reminderTime: "Reminder time must use HH:MM 24-hour format.",
    });
  });

  it("builds reminder drafts and starter-pack picker options", () => {
    expect(createReminderDraft(baseSettings)).toStrictEqual({
      reminderEnabled: true,
      reminderTime: "20:30",
      timezone: "Asia/Singapore",
    });

    expect(getStarterPackSummaryOptions(true).at(-1)).toStrictEqual({
      description:
        "Start with an empty dashboard and build your system manually later.",
      habitCount: 0,
      id: "blank",
      label: "Start blank",
    });
  });
});
