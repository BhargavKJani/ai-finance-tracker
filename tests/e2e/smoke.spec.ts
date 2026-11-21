import { expect, test } from "@playwright/test";

test("landing page renders hero, features and pricing", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("digital twin");
  await expect(page.getByTestId("plan-free")).toBeVisible();
  await expect(page.getByTestId("plan-premium")).toContainText("$4.92");
  await page.getByRole("tab", { name: "Monthly" }).click();
  await expect(page.getByTestId("plan-premium")).toContainText("$7");
});

test("live demo link auto-loads sample data", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Try the live demo" }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByTestId("insight-card").first()).toBeVisible();
});

test("premium CTA shows the beta notice", async ({ page }) => {
  await page.goto("/pricing");
  await page.getByRole("link", { name: "Go Premium" }).click();
  await expect(page.getByTestId("toast")).toContainText("Premium checkout is coming soon");
});

test("API status reports demo mode without a key", async ({ request }) => {
  const res = await request.get("/api/status");
  expect(await res.json()).toMatchObject({ mode: "demo", model: "claude-sonnet-5-5" });
});
