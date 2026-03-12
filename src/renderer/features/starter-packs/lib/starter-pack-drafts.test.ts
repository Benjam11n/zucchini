import {
  createStarterPackDrafts,
  getStarterPackSummaryOptions,
  hasStarterPackHabits,
  removeStarterPackHabitDraft,
  toStarterPackHabits,
  updateStarterPackHabitDraft,
} from "./starter-pack-drafts";

describe("starter pack drafts", () => {
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

  it("detects empty packs and exposes the blank option", () => {
    expect(hasStarterPackHabits([])).toBeFalsy();
    expect(
      hasStarterPackHabits([
        {
          name: "  ",
        },
      ])
    ).toBeFalsy();

    expect(getStarterPackSummaryOptions(true).at(-1)).toStrictEqual({
      description:
        "Start with an empty dashboard and build your system manually later.",
      habitCount: 0,
      id: "blank",
      label: "Start blank",
    });
  });
});
