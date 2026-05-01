// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";

import type { AppTab } from "@/renderer/app/app.types";

import { AppShell } from "./app-shell";

function setupUpdaterMock() {
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
}

describe("app shell", () => {
  function renderAppShell(tab: AppTab = "today") {
    return render(
      <AppShell onTabChange={vi.fn()} tab={tab}>
        <div data-testid="content">page content</div>
      </AppShell>
    );
  }

  it("renders all navigation tabs for both desktop and mobile layouts", () => {
    setupUpdaterMock();
    renderAppShell("today");

    expect(screen.getAllByRole("tab", { name: "Today" })).toHaveLength(2);
    expect(screen.getAllByRole("tab", { name: "Wind Down" })).toHaveLength(2);
    expect(screen.getAllByRole("tab", { name: "Focus" })).toHaveLength(2);
    expect(screen.getAllByRole("tab", { name: "History" })).toHaveLength(2);
    expect(screen.getAllByRole("tab", { name: "Settings" })).toHaveLength(2);
  });

  it("constrains the main content column to avoid horizontal width leaks", () => {
    setupUpdaterMock();
    const { container } = renderAppShell();

    expect(container.querySelector("section")).toHaveClass(
      "min-w-0",
      "overflow-x-hidden"
    );
    const [tabpanel] = screen.getAllByRole("tabpanel");
    if (!tabpanel) {
      throw new Error("Expected a tabpanel element.");
    }

    expect(container.querySelector("section > div")).toHaveClass("max-w-5xl");
    expect(tabpanel).toHaveClass("min-w-0");
  });

  it("renders children inside the active tab panel", () => {
    setupUpdaterMock();
    renderAppShell("today");

    expect(screen.getByTestId("content")).toHaveTextContent("page content");
  });

  it("renders an optional right sidebar", () => {
    setupUpdaterMock();
    render(
      <AppShell
        rightSidebar={<div data-testid="right-sidebar">summary</div>}
        onTabChange={vi.fn()}
        tab="today"
      >
        <div data-testid="content">page content</div>
      </AppShell>
    );

    expect(screen.getByTestId("right-sidebar")).toHaveTextContent("summary");
  });
});
