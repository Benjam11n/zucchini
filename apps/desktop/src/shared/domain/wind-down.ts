export interface WindDownAction {
  createdAt: string;
  id: number;
  name: string;
  sortOrder: number;
}

export interface WindDownActionWithStatus extends WindDownAction {
  completed: boolean;
  completedAt: string | null;
}

export interface WindDownState {
  actions: WindDownActionWithStatus[];
  completedCount: number;
  date: string;
  isComplete: boolean;
  totalCount: number;
}

export function buildEmptyWindDownState(date: string): WindDownState {
  return {
    actions: [],
    completedCount: 0,
    date,
    isComplete: false,
    totalCount: 0,
  };
}
