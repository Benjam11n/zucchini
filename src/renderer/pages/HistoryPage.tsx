import type { DailySummary } from "../../shared/domain/streak";

type HistoryPageProps = {
  history: DailySummary[];
};

export function HistoryPage({ history }: HistoryPageProps) {
  return (
    <div className="page">
      <header className="panel">
        <p className="eyebrow">History</p>
        <h2>Recent days</h2>
      </header>

      <div className="history-list">
        {history.map((day) => (
          <article className="history-row panel" key={day.date}>
            <div>
              <strong>{day.date}</strong>
              <p>
                {day.allCompleted ? "Completed" : "Incomplete"} · Streak after day:{" "}
                {day.streakCountAfterDay}
              </p>
            </div>
            <span className={day.freezeUsed ? "pill used" : "pill"}>
              {day.freezeUsed ? "Freeze used" : "No freeze"}
            </span>
          </article>
        ))}
      </div>
    </div>
  );
}
