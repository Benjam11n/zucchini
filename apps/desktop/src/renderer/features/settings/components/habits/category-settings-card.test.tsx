// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";

import { createDefaultAppSettings } from "@/shared/domain/settings";

import { CategorySettingsCard } from "./category-settings-card";

describe("CategorySettingsCard", () => {
  it("renders the three category rows with current labels", () => {
    render(
      <CategorySettingsCard
        fieldErrors={{}}
        onChange={vi.fn()}
        settings={createDefaultAppSettings("Asia/Singapore")}
      />
    );

    expect(screen.getByDisplayValue("Nutrition")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Productivity")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Fitness")).toBeInTheDocument();
  });

  it("updates the category label and color through the settings draft", () => {
    const onChange = vi.fn();
    const settings = createDefaultAppSettings("Asia/Singapore");

    render(
      <CategorySettingsCard
        fieldErrors={{}}
        onChange={onChange}
        settings={settings}
      />
    );

    fireEvent.change(screen.getByDisplayValue("Nutrition"), {
      target: { value: "Fuel" },
    });

    expect(onChange).toHaveBeenCalledWith({
      ...settings,
      categoryPreferences: {
        ...settings.categoryPreferences,
        nutrition: {
          ...settings.categoryPreferences.nutrition,
          label: "Fuel",
        },
      },
    });

    fireEvent.change(screen.getByLabelText("Nutrition color"), {
      target: { value: "#123456" },
    });

    expect(onChange).toHaveBeenCalledWith({
      ...settings,
      categoryPreferences: {
        ...settings.categoryPreferences,
        nutrition: {
          ...settings.categoryPreferences.nutrition,
          color: "#123456",
        },
      },
    });

    fireEvent.click(screen.getByRole("button", { name: /Utensils/i }));
    fireEvent.click(screen.getByLabelText("Use Apple icon for Nutrition"));

    expect(onChange).toHaveBeenCalledWith({
      ...settings,
      categoryPreferences: {
        ...settings.categoryPreferences,
        nutrition: {
          ...settings.categoryPreferences.nutrition,
          icon: "apple",
        },
      },
    });
  });

  it("updates icon picker labels when category names change", () => {
    const settings = createDefaultAppSettings("Asia/Singapore");

    const { rerender } = render(
      <CategorySettingsCard
        fieldErrors={{}}
        onChange={vi.fn()}
        settings={settings}
      />
    );

    expect(screen.getByTitle("Change Nutrition color")).toBeInTheDocument();

    rerender(
      <CategorySettingsCard
        fieldErrors={{}}
        onChange={vi.fn()}
        settings={{
          ...settings,
          categoryPreferences: {
            ...settings.categoryPreferences,
            nutrition: {
              ...settings.categoryPreferences.nutrition,
              label: "Fuel",
            },
          },
        }}
      />
    );

    expect(screen.getByTitle("Change Fuel color")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Utensils/i }));
    expect(
      screen.getByLabelText("Use Apple icon for Fuel")
    ).toBeInTheDocument();
  });
});
