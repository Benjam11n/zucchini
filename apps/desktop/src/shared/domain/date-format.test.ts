import { formatDateKey, formatIsoDateTime, formatIsoTime } from "./date-format";

describe("date format helpers", () => {
  it("formats date keys and ISO timestamps", () => {
    expect(formatDateKey("2026-03-13", "shortDateWithDayShort")).toBe(
      "Fri, Mar 13"
    );
    expect(formatIsoDateTime("2026-03-13T09:30:00.000Z", "shortTime")).toBe(
      formatIsoTime("2026-03-13T09:30:00.000Z")
    );
  });
});
