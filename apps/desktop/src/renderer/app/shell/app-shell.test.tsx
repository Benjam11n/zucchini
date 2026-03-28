// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";

import { AppShell } from "./app-shell";

describe("app shell", () => {
  it("constrains the main content column to avoid horizontal width leaks", () => {
    Object.defineProperty(window, "updater", {
      configurable: true,
      value: {
        checkForUpdates: vi.fn(() => Promise.resolve()),
        getState: vi.fn(() =>
          Promise.resolve({
            downloadedVersion: null,
            errorMessage: null,
            phase: "idle",
          })
        ),
        onStateChange: vi.fn(() => () => {}),
        quitAndInstall: vi.fn(() => Promise.resolve()),
      },
    });

    const { container } = render(
      <AppShell onTabChange={vi.fn()} tab="today">
        <div>content</div>
      </AppShell>
    );

    expect(container.querySelector("section")).toHaveClass(
      "min-w-0",
      "overflow-x-hidden"
    );
    expect(screen.getByRole("tabpanel")).toHaveClass("min-w-0");
  });
});
