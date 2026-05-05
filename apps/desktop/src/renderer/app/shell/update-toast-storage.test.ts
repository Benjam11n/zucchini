import {
  clearDismissedUpdateVersion,
  readDismissedUpdateVersion,
  writeDismissedUpdateVersion,
} from "@/renderer/shared/lib/update-toast-storage";

const storage = new Map<string, string>();

const localStorageMock = {
  getItem(key: string): string | null {
    return storage.get(key) ?? null;
  },
  removeItem(key: string): void {
    storage.delete(key);
  },
  setItem(key: string, value: string): void {
    storage.set(key, value);
  },
};

describe("update toast storage", () => {
  function installLocalStorageMock(): void {
    storage.clear();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: localStorageMock,
    });
  }

  it("round-trips a dismissed update version through localStorage", () => {
    installLocalStorageMock();

    writeDismissedUpdateVersion("0.1.1-beta.10");

    expect(readDismissedUpdateVersion()).toBe("0.1.1-beta.10");
  });

  it("returns null for invalid persisted dismissal state", () => {
    installLocalStorageMock();
    storage.set(
      "zucchini_update_toast_dismissal",
      JSON.stringify({ dismissedVersion: 10 })
    );

    expect(readDismissedUpdateVersion()).toBeNull();
  });

  it("clears the dismissed update version", () => {
    installLocalStorageMock();

    writeDismissedUpdateVersion("0.1.1-beta.10");
    clearDismissedUpdateVersion();

    expect(readDismissedUpdateVersion()).toBeNull();
  });
});
