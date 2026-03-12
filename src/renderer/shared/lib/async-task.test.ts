import { runAsyncTask } from "@/renderer/shared/lib/async-task";

describe("runAsyncTask()", () => {
  it("runs start, success, and finally callbacks around a successful task", async () => {
    const events: string[] = [];

    const result = await runAsyncTask(() => Promise.resolve("done"), {
      onFinally: () => {
        events.push("finally");
      },
      onStart: () => {
        events.push("start");
      },
      onSuccess: (value) => {
        events.push(`success:${value}`);
      },
    });

    expect(result).toBe("done");
    expect(events).toStrictEqual(["start", "success:done", "finally"]);
  });

  it("maps errors for the error callback without rethrowing by default", async () => {
    const events: string[] = [];

    const result = await runAsyncTask(
      () => {
        throw new Error("boom");
      },
      {
        mapError: () => "mapped-error",
        onError: (value, originalError) => {
          events.push(value);
          events.push((originalError as Error).message);
        },
        onFinally: () => {
          events.push("finally");
        },
      }
    );

    expect(result).toBeUndefined();
    expect(events).toStrictEqual(["mapped-error", "boom", "finally"]);
  });

  it("rethrows after running the error callback when requested", async () => {
    const events: string[] = [];

    await expect(
      runAsyncTask(
        () => {
          throw new Error("boom");
        },
        {
          onError: () => {
            events.push("error");
          },
          onFinally: () => {
            events.push("finally");
          },
          rethrow: true,
        }
      )
    ).rejects.toThrow("boom");

    expect(events).toStrictEqual(["error", "finally"]);
  });
});
