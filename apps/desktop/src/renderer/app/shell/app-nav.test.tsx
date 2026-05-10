// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type * as TabsModule from "@/renderer/shared/components/ui/tabs";

import { AppNav } from "./app-nav";

vi.mock<typeof TabsModule>(
  import("@/renderer/shared/components/ui/tabs"),
  async (importOriginal) => {
    const actual = await importOriginal();

    return {
      ...actual,
      TabsList: ({ children }: { children?: ReactNode }) => (
        <div>{children}</div>
      ),
      TabsTrigger: ({
        children,
        value,
        ...props
      }: {
        children?: ReactNode;
        value: string;
      }) => (
        <button type="button" value={value} {...props}>
          {children}
        </button>
      ),
    };
  }
);

describe("AppNav", () => {
  it("includes the Insights navigation item", () => {
    render(<AppNav />);

    expect(screen.getByLabelText("Insights")).toBeInTheDocument();
  });
});
