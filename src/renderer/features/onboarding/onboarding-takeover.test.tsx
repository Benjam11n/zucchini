// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type * as StarterPackEditorModule from "@/renderer/features/starter-packs/components/starter-pack-editor";
import type * as StarterPackPickerModule from "@/renderer/features/starter-packs/components/starter-pack-picker";
import type {
  StarterPackEditorProps,
  StarterPackPickerProps,
} from "@/renderer/features/starter-packs/starter-packs.types";
import type { AppSettings } from "@/shared/domain/settings";

import type * as OnboardingReminderStepModule from "./components/onboarding-reminder-step";
import { OnboardingTakeover } from "./onboarding-takeover";
import type {
  OnboardingReminderDraft,
  ReminderFieldErrors,
} from "./onboarding.types";

vi.mock<typeof StarterPackPickerModule>(
  import("@/renderer/features/starter-packs/components/starter-pack-picker"),
  () => ({
    StarterPackPicker: ({
      onSelectChoice,
      selectedChoice,
    }: StarterPackPickerProps) => (
      <div>
        <button onClick={() => onSelectChoice("focus-system")} type="button">
          Choose focus-system
        </button>
        <button onClick={() => onSelectChoice("blank")} type="button">
          Choose blank
        </button>
        <p data-testid="selected-choice">{selectedChoice ?? "none"}</p>
      </div>
    ),
  })
);

vi.mock<typeof StarterPackEditorModule>(
  import("@/renderer/features/starter-packs/components/starter-pack-editor"),
  () => ({
    StarterPackEditor: ({ drafts, onChange }: StarterPackEditorProps) => (
      <div>
        <p data-testid="draft-count">{drafts.length}</p>
        <button onClick={() => onChange([])} type="button">
          Remove all habits
        </button>
      </div>
    ),
  })
);

vi.mock<typeof OnboardingReminderStepModule>(
  import("./components/onboarding-reminder-step"),
  () => ({
    OnboardingReminderStep: ({
      fieldErrors,
      onChange,
      reminderDraft,
    }: {
      fieldErrors: ReminderFieldErrors;
      onChange: (draft: OnboardingReminderDraft) => void;
      reminderDraft: OnboardingReminderDraft;
    }) => (
      <div>
        <label htmlFor="reminder-enabled">Enable reminders</label>
        <input
          checked={reminderDraft.reminderEnabled}
          id="reminder-enabled"
          onChange={(event) =>
            onChange({
              ...reminderDraft,
              reminderEnabled: event.target.checked,
            })
          }
          type="checkbox"
        />

        <label htmlFor="reminder-time">Reminder time</label>
        <input
          id="reminder-time"
          onChange={(event) =>
            onChange({
              ...reminderDraft,
              reminderTime: event.target.value,
            })
          }
          value={reminderDraft.reminderTime}
        />

        <label htmlFor="timezone">Timezone</label>
        <select
          id="timezone"
          onChange={(event) =>
            onChange({
              ...reminderDraft,
              timezone: event.target.value,
            })
          }
          value={reminderDraft.timezone}
        >
          <option value="Asia/Singapore">Asia/Singapore</option>
          <option value="America/New_York">America/New_York</option>
        </select>

        {fieldErrors.reminderTime ? <p>{fieldErrors.reminderTime}</p> : null}
        {fieldErrors.timezone ? <p>{fieldErrors.timezone}</p> : null}
      </div>
    ),
  })
);

function createBaseSettings(): AppSettings {
  return {
    launchAtLogin: false,
    minimizeToTray: false,
    reminderEnabled: true,
    reminderSnoozeMinutes: 15,
    reminderTime: "20:30",
    themeMode: "system",
    timezone: "Asia/Singapore",
  };
}

function stubNotification(
  permission: NotificationPermission = "default",
  result: NotificationPermission = "granted"
) {
  const requestPermission = vi.fn().mockResolvedValue(result);

  vi.stubGlobal("Notification", {
    permission,
    requestPermission,
  });

  return {
    requestPermission,
  };
}

describe("onboarding takeover", () => {
  it("completes onboarding from the blank flow and requests notification permission", async () => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();

    const onComplete = vi.fn().mockResolvedValue(42);
    const onSkip = vi.fn().mockResolvedValue(42);
    const { requestPermission } = stubNotification();

    render(
      <OnboardingTakeover
        baseSettings={createBaseSettings()}
        error={null}
        onComplete={onComplete}
        onSkip={onSkip}
        phase="idle"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Choose blank" }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.click(screen.getByRole("button", { name: "Start blank" }));

    await waitFor(() => {
      // eslint-disable-next-line vitest/prefer-called-once
      expect(requestPermission).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledWith({
        habits: [],
        settings: createBaseSettings(),
      });
    });
  });

  it("shows reminder validation errors and blocks submission", async () => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();

    const onComplete = vi.fn().mockResolvedValue(42);
    const onSkip = vi.fn().mockResolvedValue(42);
    const { requestPermission } = stubNotification();

    render(
      <OnboardingTakeover
        baseSettings={createBaseSettings()}
        error={null}
        onComplete={onComplete}
        onSkip={onSkip}
        phase="idle"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Choose blank" }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.change(screen.getByLabelText("Reminder time"), {
      target: { value: "99:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Start blank" }));

    await expect(
      screen.findByText("Reminder time must use HH:MM 24-hour format.")
    ).resolves.toBeInTheDocument();
    expect(requestPermission).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("surfaces a blocked notification message when permission is denied", async () => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();

    const onComplete = vi.fn().mockResolvedValue(42);
    const onSkip = vi.fn().mockResolvedValue(42);
    const { requestPermission } = stubNotification("denied", "denied");

    render(
      <OnboardingTakeover
        baseSettings={createBaseSettings()}
        error={null}
        onComplete={onComplete}
        onSkip={onSkip}
        phase="idle"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Choose blank" }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await expect(
      screen.findByText(
        "Notifications are blocked by the OS or browser. Zucchini will still save your reminder settings."
      )
    ).resolves.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Start blank" }));

    await waitFor(() => {
      expect(requestPermission).not.toHaveBeenCalled();
      // eslint-disable-next-line vitest/prefer-called-once
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  it("disables the edit-step continue button when all starter-pack habits are removed", () => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();

    const onComplete = vi.fn().mockResolvedValue(42);
    const onSkip = vi.fn().mockResolvedValue(42);

    render(
      <OnboardingTakeover
        baseSettings={createBaseSettings()}
        error={null}
        onComplete={onComplete}
        onSkip={onSkip}
        phase="idle"
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Choose focus-system" })
    );
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    const editContinueButton = screen.getByRole("button", {
      name: /continue/i,
    });

    expect(editContinueButton).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Remove all habits" }));
    expect(editContinueButton).toBeDisabled();
  });
});
