import { HabitsIpcError } from "@/shared/contracts/habits-ipc";

import { getBootErrorDisplay } from "./boot-errors";

describe("getBootErrorDisplay()", () => {
  it("maps database errors to local data messaging", () => {
    expect(
      getBootErrorDisplay(
        new HabitsIpcError({
          code: "DATABASE_ERROR",
          message: "db failed",
        })
      )
    ).toStrictEqual({
      description: "Zucchini could not access its local database. Try again.",
      title: "Could not open your local data",
    });
  });

  it("maps validation errors to stored data messaging", () => {
    expect(
      getBootErrorDisplay(
        new HabitsIpcError({
          code: "VALIDATION_ERROR",
          message: "bad data",
        })
      )
    ).toStrictEqual({
      description: "Some local data did not pass validation. Try again.",
      title: "Stored data needs attention",
    });
  });

  it("falls back to a generic startup error message", () => {
    expect(getBootErrorDisplay(null)).toStrictEqual({
      description: "Something went wrong while loading your dashboard. Try again.",
      title: "Could not start Zucchini",
    });
  });
});
