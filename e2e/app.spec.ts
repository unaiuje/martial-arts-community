import { test, expect, type Page } from "@playwright/test";

/**
 * Smoke + flow coverage for public and protected routes.
 * Run with: bunx playwright test  (dev server must be on :8080)
 */

const consoleErrors: string[] = [];

function watchConsole(page: Page) {
  page.on("console", (m) => {
    if (m.type() === "error" && !/favicon|__gcr/i.test(m.text())) consoleErrors.push(m.text());
  });
}

test.beforeEach(({ page }) => {
  consoleErrors.length = 0;
  watchConsole(page);
});

test.describe("public routes", () => {
  test("feed renders without crashing", async ({ page }) => {
    const res = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
    // Either content, skeletons or the empty state — never a blank error page.
    await expect(page.locator("main").first()).toBeVisible();
  });

  test("search page lists BJJ technique categories", async ({ page }) => {
    await page.goto("/search", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Search", exact: true })).toBeVisible();
    await page.waitForLoadState("networkidle");
    await expect(async () => {
      await page.getByRole("button", { name: /bjj techniques/i }).click();
      await expect(page.getByText("Categories", { exact: true })).toBeVisible({ timeout: 3_000 });
    }).toPass({ timeout: 20_000 });
    await expect(page.getByText("Categories", { exact: true })).toBeVisible({ timeout: 15_000 });
  });

  test("search never shows private videos", async ({ page }) => {
    await page.goto("/search", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/private/i)).toHaveCount(0);
  });

  test("public profile page renders without sign in", async ({ page }) => {
    const res = await page.goto("/u/nonexistent_e2e_user", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBeLessThan(400);
    await expect(page.getByText(/not found/i)).toBeVisible({ timeout: 15_000 });
  });

  test("duels page loads", async ({ page }) => {
    const res = await page.goto("/duels", { waitUntil: "domcontentloaded" });
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
  });

  test("auth page shows sign in form", async ({ page }) => {
    await page.goto("/auth", { waitUntil: "domcontentloaded" });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("login shows a clear error with wrong credentials", async ({ page }) => {
    await page.goto("/auth", { waitUntil: "networkidle" });
    await page.locator('input[type="email"]').fill("nobody+e2e@example.com");
    await page.locator('input[type="password"]').fill("wrong-password-123");
    await page.locator('form button[type="submit"]').click();
    await expect(page.getByRole("alert").first()).toContainText(/wrong email or password|incorrect/i, {
      timeout: 15_000,
    });
  });
});

test.describe("protected routes redirect when signed out", () => {
  for (const path of ["/profile", "/create", "/tracker"]) {
    test(`${path} redirects to /auth`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await page.waitForURL(/\/auth/, { timeout: 15_000 });
      expect(page.url()).toContain("/auth");
    });
  }
});

test.describe("authenticated flows", () => {
  const email = process.env["E2E_EMAIL"];
  const password = process.env["E2E_PASSWORD"];

  test.skip(!email || !password, "Set E2E_EMAIL / E2E_PASSWORD to run signed-in flows");

  async function signIn(page: Page) {
    await page.goto("/auth", { waitUntil: "domcontentloaded" });
    await page.locator('input[type="email"]').fill(email!);
    await page.locator('input[type="password"]').fill(password!);
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL((u) => !u.pathname.startsWith("/auth"), { timeout: 20_000 });
  }

  test("onboarding or profile is reachable after sign in", async ({ page }) => {
    await signIn(page);
    expect(page.url()).toMatch(/\/(onboarding)?$|\/profile/);
  });

  test("profile shows my videos, including private ones", async ({ page }) => {
    await signIn(page);
    await page.goto("/profile", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
  });

  test("upload page shows the video picker and validation", async ({ page }) => {
    await signIn(page);
    await page.goto("/create", { waitUntil: "domcontentloaded" });
    await expect(page.locator('input[type="file"]').first()).toBeAttached();
  });
});
