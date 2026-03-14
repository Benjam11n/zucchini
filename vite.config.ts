import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { buildContentSecurityPolicy } from "./src/shared/security/content-security-policy";
import type { ContentSecurityPolicyMode } from "./src/shared/security/content-security-policy";

export default defineConfig(({ command }) => ({
  base: command === "serve" ? "/" : "./",
  plugins: [
    {
      name: "zucchini-csp",
      transformIndexHtml(html) {
        const mode: ContentSecurityPolicyMode =
          command === "serve" ? "development" : "production";

        return html.replace("%APP_CSP%", buildContentSecurityPolicy(mode));
      },
    },
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
}));
