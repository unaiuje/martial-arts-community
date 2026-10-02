import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env["E2E_BASE_URL"] ?? "http://localhost:8080",
    trace: "off",
    ...devices["Pixel 7"],
    launchOptions: process.env["PLAYWRIGHT_CHROMIUM_PATH"]
      ? { executablePath: process.env["PLAYWRIGHT_CHROMIUM_PATH"] }
      : {},
  },
});
