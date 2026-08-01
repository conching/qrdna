import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// The suite signs in as a real user against a real Supabase project, so it
// needs the same environment the dev server does.
loadEnv({ path: ".env.local", quiet: true });

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  // These are end-to-end journeys against one shared account; running them
  // concurrently would have them tripping over each other's rows.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 90_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],

  // Only manage a server for localhost. Pointed at a deployment, just talk to it.
  webServer: baseURL.startsWith("http://localhost")
    ? {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      }
    : undefined,
});
