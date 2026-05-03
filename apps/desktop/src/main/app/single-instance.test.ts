import {
  acquireSingleInstanceLock,
  registerSecondInstanceHandler,
} from "@/main/app/single-instance";

function registerHandlerForPrimaryInstance(app: {
  on: (event: "second-instance", listener: () => void) => void;
  requestSingleInstanceLock: () => boolean;
}): void {
  if (acquireSingleInstanceLock(app)) {
    registerSecondInstanceHandler(app, vi.fn());
  }
}

describe("single-instance helpers", () => {
  it("returns true when the app acquires the single-instance lock", () => {
    const app = {
      requestSingleInstanceLock: vi.fn(() => true),
    };

    expect(acquireSingleInstanceLock(app)).toBeTruthy();
    expect(app.requestSingleInstanceLock.mock.calls).toHaveLength(1);
  });

  it("returns false when the app fails to acquire the single-instance lock", () => {
    const app = {
      requestSingleInstanceLock: vi.fn(() => false),
    };

    expect(acquireSingleInstanceLock(app)).toBeFalsy();
    expect(app.requestSingleInstanceLock.mock.calls).toHaveLength(1);
  });

  it("calls showMainWindow when the second-instance event fires", () => {
    const showMainWindow = vi.fn();
    const app = {
      on: vi.fn(),
    };

    registerSecondInstanceHandler(app, showMainWindow);
    const secondInstanceListener = app.on.mock.calls[0]?.[1] as
      | (() => void)
      | undefined;

    secondInstanceListener?.();

    expect(app.on.mock.calls).toHaveLength(1);
    expect(app.on).toHaveBeenCalledWith(
      "second-instance",
      expect.any(Function)
    );
    expect(showMainWindow.mock.calls).toHaveLength(1);
  });

  it("registers the second-instance handler only for the primary instance path", () => {
    const primaryAppLike = {
      on: vi.fn(),
      requestSingleInstanceLock: vi.fn(() => true),
    };
    const secondaryAppLike = {
      on: vi.fn(),
      requestSingleInstanceLock: vi.fn(() => false),
    };

    registerHandlerForPrimaryInstance(primaryAppLike);
    registerHandlerForPrimaryInstance(secondaryAppLike);

    expect(primaryAppLike.on.mock.calls).toHaveLength(1);
    expect(secondaryAppLike.on).not.toHaveBeenCalled();
  });
});
