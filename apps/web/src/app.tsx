/**
 * Marketing landing page root component.
 *
 * Renders the Zucchini product landing page with feature highlights,
 * mascot branding, and a link to the latest GitHub release for download.
 * No routing or state management — just static content and external links.
 */
import {
  ArrowRight,
  CalendarDays,
  Flame,
  ArrowUpRight,
  ListChecks,
  Snowflake,
  Utensils,
} from "lucide-react";

import { latestReleaseUrl } from "./constants";
import { formatPreviewDate, getCopyrightYear } from "./date";
import PixelBlast from "./pixel-blast";

const previewDateLabel = formatPreviewDate(new Date());
const copyrightYear = getCopyrightYear(new Date());

export default function App() {
  return (
    <div className="page-shell">
      <div aria-hidden="true" className="pixel-blast" role="presentation">
        <PixelBlast
          className="pixel-blast-layer"
          color="#669c35"
          edgeFade={0.25}
          enableRipples
          liquid={false}
          liquidRadius={1.2}
          liquidStrength={0.12}
          liquidWobbleSpeed={5}
          patternDensity={1}
          patternScale={2}
          pixelSize={4}
          pixelSizeJitter={0}
          rippleIntensityScale={1.5}
          rippleSpeed={0.4}
          rippleThickness={0.12}
          speed={0.5}
          style={{ opacity: 0.65 }}
          transparent
          variant="square"
        />
        <div className="pixel-blast-noise" />
        <div className="pixel-blast-vignette" />
      </div>
      <nav className="nav">
        <div className="logo">
          <img
            alt="Zucchini"
            src="/branding/app-icon.png"
            width="40"
            height="40"
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
            where they belong, on your machine.
          </p>
          <div className="actions">
            <a href={latestReleaseUrl} className="btn btn-primary">
              Download for macOS <ArrowUpRight size={16} />
            </a>
            <a
              href="https://github.com/Benjam11n/zucchini"
              className="btn btn-secondary"
            >
              View Source <ArrowRight size={18} />
            </a>
          </div>

          <div className="app-preview-container">
            <div className="app-preview">
              <div className="window-header">
                <div className="dot" />
                <div className="dot" />
                <div className="dot" />
              </div>
              <div className="window-content-v2">
                {/* History Carousel Mock */}
                <div className="history-carousel">
                  {[
                    { day: "SUN", id: "week-1-sun", progressIndex: 0 },
                    { day: "MON", id: "week-1-mon", progressIndex: 1 },
                    { day: "TUE", id: "week-1-tue", progressIndex: 2 },
                    { day: "WED", id: "week-1-wed", progressIndex: 3 },
                    { day: "THU", id: "week-1-thu", progressIndex: 4 },
                    { day: "FRI", id: "week-1-fri", progressIndex: 5 },
                    { day: "SAT", id: "week-1-sat", progressIndex: 6 },
                    { day: "SUN", id: "week-2-sun", progressIndex: 7 },
                    { day: "MON", id: "week-2-mon", progressIndex: 8 },
                    { day: "TUE", id: "week-2-tue", progressIndex: 9 },
                    { day: "WED", id: "week-2-wed", progressIndex: 10 },
                    { day: "THU", id: "week-2-thu", progressIndex: 11 },
                    { day: "FRI", id: "week-2-fri", progressIndex: 12 },
                    { day: "SAT", id: "week-2-sat", progressIndex: 13 },
                  ].map(({ day, id, progressIndex }) => (
                    <div key={id} className="history-day">
                      <svg viewBox="0 0 40 40" width="32" height="32">
                        {/* Fitness Ring (Outer) */}
                        <circle
                          cx="20"
                          cy="20"
                          r="18"
                          fill="none"
                          stroke="var(--ring-fitness-muted)"
                          strokeWidth="3.5"
                        />
                        <circle
                          cx="20"
                          cy="20"
                          r="18"
                          fill="none"
                          stroke="var(--ring-fitness)"
                          strokeWidth="3.5"
                          strokeDasharray="113"
                          strokeDashoffset={20 + (progressIndex % 5) * 10}
                          strokeLinecap="round"
                          transform="rotate(-90 20 20)"
                        />

                        {/* Nutrition Ring (Middle) */}
                        <circle
                          cx="20"
                          cy="20"
                          r="13.5"
                          fill="none"
                          stroke="var(--ring-nutrition-muted)"
                          strokeWidth="3.5"
                        />
                        <circle
                          cx="20"
                          cy="20"
                          r="13.5"
                          fill="none"
                          stroke="var(--ring-nutrition)"
                          strokeWidth="3.5"
                          strokeDasharray="85"
                          strokeDashoffset={15 + (progressIndex % 4) * 12}
                          strokeLinecap="round"
                          transform="rotate(-90 20 20)"
                        />

                        {/* Productivity Ring (Inner) */}
                        <circle
                          cx="20"
                          cy="20"
                          r="9"
                          fill="none"
                          stroke="var(--ring-productivity-muted)"
                          strokeWidth="3.5"
                        />
                        <circle
                          cx="20"
                          cy="20"
                          r="9"
                          fill="none"
                          stroke="var(--ring-productivity)"
                          strokeWidth="3.5"
                          strokeDasharray="57"
                          strokeDashoffset={10 + (progressIndex % 3) * 15}
                          strokeLinecap="round"
                          transform="rotate(-90 20 20)"
                        />
                      </svg>
                      <span>{day}</span>
                    </div>
                  ))}
                </div>

                {/* Main Activity Card */}
                <div className="card activity-main-card">
                  <div className="activity-top-row">
                    <div className="activity-rings-large">
                      <svg viewBox="0 0 200 200" width="200" height="200">
                        {/* Background Rings */}
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke="var(--ring-fitness-muted)"
                          strokeWidth="18"
                        />
                        <circle
                          cx="100"
                          cy="100"
                          r="60"
                          fill="none"
                          stroke="var(--ring-nutrition-muted)"
                          strokeWidth="18"
                        />
                        <circle
                          cx="100"
                          cy="100"
                          r="40"
                          fill="none"
                          stroke="var(--ring-productivity-muted)"
                          strokeWidth="18"
                        />

                        {/* Fitness Ring (Outer) */}
                        <circle
                          cx="100"
                          cy="100"
                          r="80"
                          fill="none"
                          stroke="var(--ring-fitness)"
                          strokeWidth="18"
                          strokeDasharray="502"
                          strokeDashoffset="251"
                          strokeLinecap="round"
                          transform="rotate(-90 100 100)"
                          style={{
                            filter:
                              "drop-shadow(0 0 4px var(--ring-fitness-shadow))",
                          }}
                        />

                        {/* Nutrition Ring (Middle) */}
                        <circle
                          cx="100"
                          cy="100"
                          r="60"
                          fill="none"
                          stroke="var(--ring-nutrition)"
                          strokeWidth="18"
                          strokeDasharray="377"
                          strokeDashoffset="150"
                          strokeLinecap="round"
                          transform="rotate(-90 100 100)"
                          style={{
                            filter:
                              "drop-shadow(0 0 4px var(--ring-nutrition-shadow))",
                          }}
                        />

                        {/* Productivity Ring (Inner) */}
                        <circle
                          cx="100"
                          cy="100"
                          r="40"
                          fill="none"
                          stroke="var(--ring-productivity)"
                          strokeWidth="18"
                          strokeDasharray="251"
                          strokeDashoffset="125"
                          strokeLinecap="round"
                          transform="rotate(-90 100 100)"
                          style={{
                            filter:
                              "drop-shadow(0 0 4px var(--ring-productivity-shadow))",
                          }}
                        />
                      </svg>
                    </div>
                    <div className="activity-stats">
                      <div className="stat-group">
                        <span
                          className="stat-label"
                          style={{ color: "var(--ring-fitness)" }}
                        >
                          FITNESS
                        </span>
                        <span className="stat-value">
                          50<small>%</small>
                        </span>
                      </div>
                      <div className="stat-group">
                        <span
                          className="stat-label"
                          style={{ color: "var(--ring-nutrition)" }}
                        >
                          NUTRITION
                        </span>
                        <span className="stat-value">
                          60<small>%</small>
                        </span>
                      </div>
                      <div className="stat-group">
                        <span
                          className="stat-label"
                          style={{ color: "var(--ring-productivity)" }}
                        >
                          PRODUCTIVITY
                        </span>
                        <span className="stat-value">
                          50<small>%</small>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="quick-stats">
                    <div className="q-stat">
                      <span
                        className="q-icon-box"
                        style={{ color: "var(--ring-fitness)" }}
                      >
                        <Flame size={16} />
                      </span>
                      <div>
                        <strong>0</strong>
                        <small>STREAK</small>
                      </div>
                    </div>
                    <div className="q-stat">
                      <span
                        className="q-icon-box"
                        style={{ color: "var(--ring-productivity)" }}
                      >
                        <Snowflake size={16} />
                      </span>
                      <div>
                        <strong>0</strong>
                        <small>FREEZE</small>
                      </div>
                    </div>
                    <div className="q-stat">
                      <span className="q-icon-box">
                        <CalendarDays size={16} />
                      </span>
                      <div>
                        <strong>{previewDateLabel}</strong>
                        <small>DATE</small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Habit Checklist Section */}
                <div className="card checklist-section">
                  <div className="checklist-header">
                    <div className="title-row">
                      <span>
                        <ListChecks
                          size={14}
                          style={{
                            marginRight: "8px",
                            verticalAlign: "middle",
                          }}
                        />
                        Today
                      </span>
                      <button className="manage-btn" type="button">
                        Manage
                      </button>
                    </div>
                    <div className="progress-text">6/11</div>
                    <div className="main-progress-bar">
                      <div className="progress-fill" style={{ width: "55%" }} />
                    </div>
                  </div>

                  <div className="category-group">
                    <div
                      className="category-header"
                      style={{ color: "var(--ring-nutrition)" }}
                    >
                      <span>
                        <Utensils
                          size={12}
                          style={{
                            marginRight: "6px",
                            verticalAlign: "middle",
                          }}
                        />
                        NUTRITION
                      </span>
                      <span className="count">3/4</span>
                    </div>
                    {[
                      { active: true, name: "Eat zucchini" },
                      { active: false, name: "Eat Supplements" },
                      { active: true, name: "1 tbsp chia seeds" },
                      { active: false, name: "Put sunscreen in the morning" },
                    ].map((habit) => (
                      <div key={habit.name} className="habit-row">
                        <div
                          className={`check-circle ${habit.active ? "active" : ""}`}
                        >
                          {habit.active ? (
                            <svg
                              fill="none"
                              height="12"
                              stroke="white"
                              strokeWidth="4"
                              viewBox="0 0 24 24"
                              width="12"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : null}
                        </div>
                        <span className="habit-name">{habit.name}</span>
                        <div
                          className={`mini-check ${habit.active ? "active" : ""}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>&copy; {copyrightYear} Zucchini. Built for individuals.</p>
      </footer>
    </div>
  );
}
