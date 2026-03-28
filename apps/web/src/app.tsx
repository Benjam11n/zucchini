const latestReleaseUrl =
  "https://github.com/benjamingwg/zucchini/releases/latest";

const featureCards = [
  {
    body: "Keep your routines on your machine with a desktop-first setup built for personal systems, not shared accounts.",
    title: "Local-first tracking",
  },
  {
    body: "Check off habits quickly, protect streaks, and keep momentum without a noisy dashboard getting in the way.",
    title: "Fast daily flow",
  },
  {
    body: "Review trends, reminders, and weekly progress from one place so it stays useful beyond the first week.",
    title: "Useful history",
  },
] as const;

export default function App() {
  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <img
            alt="Zucchini mascot"
            className="brand-mark"
            height="64"
            src="/mascot/mascot-icon.jpeg"
            width="64"
          />
          <p className="eyebrow">Zucchini for macOS</p>
          <h1>A local-first habit tracker built for daily momentum.</h1>
          <p className="lede">
            Track habits, protect streaks, and review progress without sending
            your routines to the cloud.
          </p>
          <div className="actions">
            <a className="primary-action" href={latestReleaseUrl}>
              Download for macOS
            </a>
            <a
              className="secondary-action"
              href="https://github.com/Benjam11n/zucchini"
            >
              View on GitHub
            </a>
          </div>
          <p className="supporting-note">
            The download button currently opens the latest GitHub release.
          </p>
        </div>
        <div
          className="hero-panel"
          aria-label="Application preview placeholder"
        >
          <div className="window-chrome">
            <span />
            <span />
            <span />
          </div>
          <div className="preview-grid">
            <div className="preview-stat">
              <strong>12</strong>
              <span>day streak</span>
            </div>
            <div className="preview-stat">
              <strong>7</strong>
              <span>habits today</span>
            </div>
            <div className="preview-card">
              <p>Today</p>
              <ul>
                <li>Morning walk</li>
                <li>Read 20 min</li>
                <li>Inbox zero</li>
              </ul>
            </div>
            <div className="preview-card accent">
              <p>Weekly review</p>
              <div className="mini-bars" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features" aria-label="Core product benefits">
        {featureCards.map((feature) => (
          <article key={feature.title} className="feature-card">
            <p className="feature-title">{feature.title}</p>
            <p>{feature.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
