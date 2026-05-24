/**
 * Marketing landing page root component.
 *
 * Renders the Zucchini product landing page with feature highlights,
 * mascot branding, and build-time release metadata for download.
 * No routing or state management — just static content and external links.
 */
import { ArrowRight, ArrowUpRight } from "lucide-react";

import {
  githubRepositoryUrl,
  latestReleaseUrl,
  latestVersionLabel,
  macDownloadUrl,
} from "./constants";
import { getCopyrightYear } from "./date";
import PixelBlast from "./pixel-blast";

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
          href={githubRepositoryUrl}
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
            <a href={macDownloadUrl} className="btn btn-primary">
              Download for macOS <ArrowUpRight size={16} />
            </a>
            <a href={githubRepositoryUrl} className="btn btn-secondary">
              View Source <ArrowRight size={18} />
            </a>
          </div>
          <p className="download-meta">
            {latestVersionLabel} from{" "}
            <a href={latestReleaseUrl}>GitHub Releases</a>
          </p>

          <div className="app-preview-container">
            <div className="app-preview">
              <img
                alt="Zucchini desktop app showing today's habits and progress"
                className="app-preview-image"
                decoding="async"
                height="1051"
                loading="eager"
                src="/product/zucchini-app-preview.webp"
                width="1440"
              />
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
