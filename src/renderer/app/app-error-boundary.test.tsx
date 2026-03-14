// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";

import { AppErrorBoundary } from "@/renderer/app/app-error-boundary";

function ThrowingChild(): null {
  throw new Error("boom");
}

describe("app error boundary", () => {
  it("renders the fallback when a child throws", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(
      <AppErrorBoundary
        description="Unexpected renderer error."
        title="Something went wrong"
      >
        <ThrowingChild />
      </AppErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reload app" })).toBeVisible();

    consoleErrorSpy.mockRestore();
  });

  it("calls the provided reload handler from the fallback", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const onReload = vi.fn();

    render(
      <AppErrorBoundary
        description="Unexpected renderer error."
        title="Something went wrong"
        onReload={onReload}
      >
        <ThrowingChild />
      </AppErrorBoundary>
    );

    fireEvent.click(screen.getByRole("button", { name: "Reload app" }));

    expect(onReload).toHaveBeenCalledWith();

    consoleErrorSpy.mockRestore();
  });
});
