import {
  getTrustedDevServerUrl,
  getWindowContentUrl,
} from "@/main/app/windows/window-content";

const originalDevServerUrl = process.env["VITE_DEV_SERVER_URL"];

function withDevServerUrl(url: string | undefined, run: () => void) {
  if (url === undefined) {
    delete process.env["VITE_DEV_SERVER_URL"];
  } else {
    process.env["VITE_DEV_SERVER_URL"] = url;
  }

  try {
    run();
  } finally {
    if (originalDevServerUrl === undefined) {
      delete process.env["VITE_DEV_SERVER_URL"];
    } else {
      process.env["VITE_DEV_SERVER_URL"] = originalDevServerUrl;
    }
  }
}

describe("getTrustedDevServerUrl()", () => {
  it("allows loopback http dev server URLs when the app is not packaged", () => {
    const url = getTrustedDevServerUrl({
      appIsPackaged: false,
      devServerUrl: "http://localhost:5173/",
    });

    expect(url?.toString()).toBe("http://localhost:5173/");
  });

  it("ignores dev server URLs when the app is packaged", () => {
    const url = getTrustedDevServerUrl({
      appIsPackaged: true,
      devServerUrl: "http://localhost:5173/",
    });

    expect(url).toBeNull();
  });

  it.each([
    "https://localhost:5173/",
    "http://example.com:5173/",
    "http://localhost/",
    "not a url",
  ])("rejects untrusted dev server URL %s", (devServerUrl) => {
    const url = getTrustedDevServerUrl({
      appIsPackaged: false,
      devServerUrl,
    });

    expect(url).toBeNull();
  });
});

describe("getWindowContentUrl()", () => {
  it("uses the trusted dev server URL in development", () => {
    withDevServerUrl("http://127.0.0.1:5173/", () => {
      expect(
        getWindowContentUrl({ appIsPackaged: false, search: "?view=widget" })
      ).toBe("http://127.0.0.1:5173/?view=widget");
    });
  });

  it("uses the packaged file URL when VITE_DEV_SERVER_URL is present in production", () => {
    withDevServerUrl("http://127.0.0.1:5173/", () => {
      const url = getWindowContentUrl({ appIsPackaged: true });

      expect(url).toMatch(/^file:\/\//u);
      expect(url).toContain("/dist/index.html");
    });
  });
});
