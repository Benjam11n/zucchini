import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dbCredentials: {
    url: "./drizzle/dev.sqlite",
  },
  dialect: "sqlite",
  out: "./drizzle",
  schema: "./src/main/schema.ts",
  strict: true,
  verbose: true,
});
