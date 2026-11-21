import { expect, test } from "@playwright/test";
import path from "node:path";

test.describe("main flow (demo mode)", () => {
  test("load sample → dashboard → insights → what-if → recategorise → persist", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByTestId("empty-state")).toBeVisible();
    await expect(page.getByText("Demo AI")).toBeVisible();

    await page.getByRole("button", { name: "Load sample data" }).last().click();
    await expect(page.getByTestId("toast")).toContainText(/Imported 231 transactions/);
    await expect(page.getByTestId("toast")).toContainText(/categorised by demo AI/);

    // KPIs, charts and forecast
    await expect(page.getByText("Spent · October 2026")).toBeVisible();
    await expect(page.getByTestId("kpi-forecast")).toContainText("November 2026");
    await expect(page.getByTestId("monthly-chart").locator(".recharts-bar-rectangle").first()).toBeVisible();
    await expect(page.getByTestId("category-breakdown")).toContainText("Food Delivery");

    // AI insight cards in demo mode
    const insights = page.getByTestId("insights");
    await expect(insights.getByText("Demo mode")).toBeVisible();
    await expect(insights.getByTestId("insight-card")).toHaveCount(4);
    await expect(insights).toContainText("Food Delivery is climbing");

    // What-if via natural language
    const whatif = page.getByTestId("whatif");
    await whatif.getByLabel("What-if scenario").fill("cut food delivery 30%");
    await whatif.getByRole("button", { name: "Simulate" }).click();
    await expect(whatif.getByLabel("Cut Food Delivery")).toHaveValue("30");
    await expect(whatif.getByTestId("whatif-yearly")).not.toHaveText("$0", { timeout: 5000 });
    await expect(whatif).toContainText("In 12 months");

    // Unknown merchant was categorised by "AI", then the user teaches the twin
    const tx = page.getByTestId("transactions");
    await tx.getByLabel("Search transactions").fill("maple");
    const rows = tx.getByTestId("txn-row");
    await expect(rows).toHaveCount(6);
    await rows.first().getByRole("combobox").selectOption("Dining");
    await expect(page.getByTestId("toast")).toContainText('Updated 6 "SQ *MAPLE & CO" transactions to Dining');

    // Data persists locally across reloads, and re-importing skips duplicates
    await page.reload();
    await expect(page.getByText("Spent · October 2026")).toBeVisible();
    await page.getByRole("button", { name: "Load sample data" }).click();
    await expect(page.getByTestId("toast")).toContainText("231 duplicates skipped");
  });

  test("upload a CSV and add a transaction by hand", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByTestId("file-input").setInputFiles(path.join(__dirname, "../../public/samples/checking.csv"));
    await expect(page.getByTestId("toast")).toContainText("Imported 57 transactions from checking.csv");

    await page.getByRole("button", { name: "Add", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Add transaction" });
    await dialog.getByLabel("Description").fill("Uber Eats late night");
    await dialog.getByLabel("Amount").fill("23.50");
    await dialog.getByLabel("Date").fill("2026-10-30");
    await dialog.getByRole("button", { name: "Add", exact: true }).click();
    await expect(dialog).toBeHidden();
    await page.getByLabel("Search transactions").fill("late night");
    const row = page.getByTestId("txn-row");
    await expect(row).toHaveCount(1);
    await expect(row.getByRole("combobox")).toHaveValue("Food Delivery");
    await expect(row).toContainText("-$23.50");
  });

  test("rejects files that are not bank statements", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByTestId("file-input").setInputFiles({ name: "notes.csv", mimeType: "text/csv", buffer: Buffer.from("foo,bar\n1,2\n") });
    await expect(page.getByTestId("toast")).toContainText("Could not find Date, Description and Amount");
    await expect(page.getByTestId("empty-state")).toBeVisible();
  });
});
