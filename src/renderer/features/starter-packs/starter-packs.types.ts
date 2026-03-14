import type {
  StarterPackHabitDraft,
  StarterPackId,
} from "@/shared/domain/starter-pack";

export type StarterPackChoice = StarterPackId | "blank";

export interface EditableStarterPackHabitDraft extends StarterPackHabitDraft {
  draftId: string;
}

export interface StarterPackEditorProps {
  drafts: EditableStarterPackHabitDraft[];
  onChange: (drafts: EditableStarterPackHabitDraft[]) => void;
}

export interface StarterPackPickerProps {
  selectedChoice: StarterPackChoice | null;
  onSelectChoice: (choice: StarterPackChoice) => void;
  showBlankOption?: boolean;
}

export interface StarterPackSummaryOption {
  description: string;
  habitCount: number;
  id: StarterPackChoice;
  label: string;
}
