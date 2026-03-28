const latestReleaseUrl =
  "https://github.com/benjamingwg/zucchini/releases/latest";

export default function App() {
  return (
    <div className="page-shell">
      <nav className="nav">
        <div className="logo">
          <img
            alt="Zucchini"
            src="/mascot/mascot-icon.jpeg"
            width="32"
            height="32"
          />
          <span>Zucchini</span>
        </div>
        <a
          href="https://github.com/Benjam11n/zucchini"
          className="btn btn-secondary"
          style={{ fontSize: "0.9rem", padding: "8px 16px" }}
        >
          GitHub
        </a>
      </nav>

      <main>
        <section className="hero">
          <h1>Track habits with momentum.</h1>
          <p className="lede">
            Stay consistent without the cloud. Zucchini keeps your routines
            where they belong—on your machine.
          </p>

          <div className="actions">
            <a href={latestReleaseUrl} className="btn btn-primary">
              Download for macOS
            </a>
            <a
              href="https://github.com/Benjam11n/zucchini"
              className="btn btn-secondary"
            >
              View Source
            </a>
          </div>

          <div className="app-preview-container">
            <div className="app-preview">
              <div className="window-header">
                <div className="dot" />
                <div className="dot" />
                <div className="dot" />
              </div>
              <div className="window-content">
                <div
                  className="card"
                  style={{
                    alignItems: "center",
                    display: "flex",
                    flexDirection: "column",
                    gridRow: "span 2",
                    justifyContent: "center",
                    padding: "40px",
                  }}
                >
                  <div
                    style={{
                      height: "200px",
                      position: "relative",
                      width: "200px",
                    }}
                  >
                    <svg
                      viewBox="0 0 200 200"
                      width="200"
                      height="200"
                      className="rings-svg"
                    >
                      {/* Productivity Ring */}
                      <circle
                        cx="100"
                        cy="100"
                        r="85"
                        fill="none"
                        stroke="rgba(0, 159, 184, 0.1)"
                        strokeWidth="18"
                      />
                      <circle
                        cx="100"
                        cy="100"
                        r="85"
                        fill="none"
                        stroke="#009fb8"
                        strokeWidth="18"
                        strokeDasharray="534"
                        strokeDashoffset="130"
                        strokeLinecap="round"
                        transform="rotate(-90 100 100)"
                      />

                      {/* Fitness Ring */}
                      <circle
                        cx="100"
                        cy="100"
                        r="64"
                        fill="none"
                        stroke="rgba(255, 45, 85, 0.1)"
                        strokeWidth="18"
                      />
                      <circle
                        cx="100"
                        cy="100"
                        r="64"
                        fill="none"
                        stroke="#ff2d55"
                        strokeWidth="18"
                        strokeDasharray="402"
                        strokeDashoffset="80"
                        strokeLinecap="round"
                        transform="rotate(-90 100 100)"
                      />

                      {/* Nutrition Ring */}
                      <circle
                        cx="100"
                        cy="100"
                        r="43"
                        fill="none"
                        stroke="rgba(120, 197, 0, 0.1)"
                        strokeWidth="18"
                      />
                      <circle
                        cx="100"
                        cy="100"
                        r="43"
                        fill="none"
                        stroke="#78c500"
                        strokeWidth="18"
                        strokeDasharray="270"
                        strokeDashoffset="40"
                        strokeLinecap="round"
                        transform="rotate(-90 100 100)"
                      />
                    </svg>
                    <div
                      style={{
                        left: "50%",
                        position: "absolute",
                        textAlign: "center",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <div style={{ fontSize: '2rem', fontWeight: 800 }}>82%</div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          letterSpacing: "0.1em",
                          opacity: 0.6,
                          textTransform: "uppercase",
                        }}
                      >
                        Score
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontWeight: 700, marginBottom: "20px" }}>
                    Today&apos;s Focus
                  </div>
                  <div className="habit-item">
                    <div className="checkbox checked" />
                    <span>Morning Meditation</span>
                  </div>
                  <div className="habit-item">
                    <div className="checkbox checked" />
                    <span>Read 20 Pages</span>
                  </div>
                  <div className="habit-item">
                    <div className="checkbox" />
                    <span>Inbox Zero</span>
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontWeight: 700, marginBottom: "20px" }}>
                    Weekly Overview
                  </div>
                  <div
                    style={{
                      alignItems: "flex-end",
                      display: "flex",
                      gap: "8px",
                      height: "100px",
                    }}
                  >
                    {[
                      { day: "Mon", val: 40 },
                      { day: "Tue", val: 70 },
                      { day: "Wed", val: 45 },
                      { day: "Thu", val: 90 },
                      { day: "Fri", val: 65 },
                      { day: "Sat", val: 80 },
                      { day: "Sun", val: 50 },
                    ].map((item) => (
                      <div
                        key={item.day}
                        style={{
                          background:
                            item.day === "Thu"
                              ? "var(--accent)"
                              : "rgba(255,255,255,0.1)",
                          borderRadius: "4px",
                          flex: 1,
                          height: `${item.val}%`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>
          &copy; {new Date().getFullYear()} Zucchini. Built for individuals.
        </p>
      </footer>
    </div>
  );
}
