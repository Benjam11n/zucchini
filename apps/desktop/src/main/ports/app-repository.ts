import type { SqliteAppRepository } from "@/main/infra/persistence/sqlite-app-repository";

export interface SettledHistoryOptions {
  uncapped?: boolean;
}

export type AppRepository = Pick<SqliteAppRepository, keyof SqliteAppRepository>;

export type TodayReadModelRepositoryPort = Pick<
  AppRepository,
  | "focusQuotaGoals"
  | "focusSessions"
  | "history"
  | "settings"
  | "streaks"
  | "windDownActions"
>;
