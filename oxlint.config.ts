import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";

export default defineConfig({
  ...core,
  ignorePatterns: [
    "dist/**",
    "dist-electron/**",
    "node_modules/**",
    "release/**",
    "apps/*/dist/**",
    "apps/*/dist-electron/**",
    "apps/*/release/**",
  ],
  overrides: [...(core.overrides ?? []), ...(react.overrides ?? [])],
  plugins: [...(core.plugins ?? []), ...(react.plugins ?? [])],
  rules: {
    ...core.rules,
    ...react.rules,
    "func-style": "off",
    "max-statements": [
      "error",
      {
        max: 60,
      },
    ],
    "react-perf/jsx-no-new-function-as-prop": "off",
    "unicorn/prefer-module": "off",
  },
});
