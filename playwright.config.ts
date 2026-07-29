import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const clientRoot = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(clientRoot, "../finance-tracker-pern-server");
const webURL = process.env.E2E_WEB_URL ?? "http://127.0.0.1:4174";
const apiURL = process.env.E2E_API_URL ?? "http://127.0.0.1:5015/api";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "test-results",
  fullyParallel: false,
  workers: process.env.CI ? 2 : 1,
  retries: process.env.CI ? 2 : 0,
  timeout: 75_000,
  expect: {
    timeout: 8_000,
  },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  use: {
    baseURL: webURL,
    headless: true,
    locale: "en-US",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: [
    {
      command: "npm run test:e2e:server",
      cwd: serverRoot,
      port: 5015,
      reuseExistingServer: false,
      timeout: 180_000,
      env: {
        NODE_ENV: "test",
        E2E_ALLOW_DATABASE_RESET: "true",
        E2E_API_PORT: "5015",
        E2E_WEB_URL: webURL,
      },
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 4174",
      cwd: clientRoot,
      port: 4174,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        VITE_API_URL: apiURL,
      },
    },
  ],
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "chromium-desktop",
      testIgnore: /.*\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
    {
      name: "firefox-desktop",
      testIgnore: /.*\.setup\.ts/,
      use: { ...devices["Desktop Firefox"] },
      dependencies: ["setup"],
    },
    {
      name: "webkit-desktop",
      testIgnore: /.*\.setup\.ts/,
      use: { ...devices["Desktop Safari"] },
      dependencies: ["setup"],
    },
    {
      name: "mobile-chrome",
      testIgnore: /.*\.setup\.ts/,
      use: { ...devices["Pixel 7"] },
      dependencies: ["setup"],
    },
    {
      name: "mobile-safari",
      testIgnore: /.*\.setup\.ts/,
      use: { ...devices["iPhone 13"] },
      dependencies: ["setup"],
    },
  ],
});
