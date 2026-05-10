import {
  getHistoryStatusLabel,
  HISTORY_STATUS_UI,
} from "@/renderer/shared/components/history-status/history-status-ui";

describe("history status UI", () => {
  it("keeps labels centralized for all history status badges", () => {
    expect(getHistoryStatusLabel("complete")).toBe("Completed");
    expect(getHistoryStatusLabel("freeze")).toBe("Freeze");
    expect(getHistoryStatusLabel("in-progress")).toBe("In Progress");
    expect(getHistoryStatusLabel("in-progress", true)).toBe("Today");
    expect(getHistoryStatusLabel("missed")).toBe("Missed");
    expect(getHistoryStatusLabel("rescheduled")).toBe("Moved");
    expect(getHistoryStatusLabel("rest")).toBe("Rest day");
    expect(getHistoryStatusLabel("sick")).toBe("Sick day");
  });

  it("does not reuse moved-day emerald for completed days", () => {
    expect(HISTORY_STATUS_UI.complete.squareClassName).toContain("bg-primary");
    expect(HISTORY_STATUS_UI.complete.squareClassName).not.toContain("emerald");
    expect(HISTORY_STATUS_UI.rescheduled.squareClassName).toContain("emerald");
  });

  it("uses the same color family for freeze badges and squares", () => {
    expect(HISTORY_STATUS_UI.freeze.badgeClassName).toContain("sky");
    expect(HISTORY_STATUS_UI.freeze.squareClassName).toContain("sky");
  });
});
