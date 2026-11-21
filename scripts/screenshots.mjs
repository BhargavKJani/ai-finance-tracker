// Captures README screenshots + an animated GIF of the main flow (demo mode).
// Usage: start the app (npm run build && npx next start -p 3100), then
//   BASE_URL=http://localhost:3100 node scripts/screenshots.mjs
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { PNG } from "pngjs";
import gifenc from "gifenc";

const { GIFEncoder, quantize, applyPalette } = gifenc;
const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const OUT = "docs";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: "dark" });
const page = await ctx.newPage();
const wait = (ms) => page.waitForTimeout(ms);

// --- Static screenshots
await page.goto(`${BASE}/`);
await wait(1800);
await page.screenshot({ path: `${OUT}/landing.png` });

await page.goto(`${BASE}/pricing`);
await wait(1200);
await page.screenshot({ path: `${OUT}/pricing.png` });

// --- GIF frames of the main flow
const frames = [];
const GIF_W = 960;
const GIF_H = 600;
const gifPage = await (await browser.newContext({ viewport: { width: GIF_W, height: GIF_H }, colorScheme: "dark" })).newPage();
const grab = async (holdMs = 0, count = 1) => {
  for (let i = 0; i < count; i++) {
    frames.push({ buf: await gifPage.screenshot(), delay: holdMs });
  }
};

await gifPage.goto(`${BASE}/dashboard`);
await gifPage.waitForSelector("[data-testid=empty-state]");
await gifPage.waitForTimeout(700);
await grab(1400);
await gifPage.getByRole("button", { name: "Load sample data" }).last().click();
for (let i = 0; i < 8; i++) {
  await gifPage.waitForTimeout(140);
  await grab(140);
}
await gifPage.waitForSelector("[data-testid=insight-card]");
await gifPage.waitForTimeout(900);
await grab(1600);
for (let y = 0; y < 5; y++) {
  await gifPage.mouse.wheel(0, 380);
  await gifPage.waitForTimeout(450);
  await grab(700);
}
await gifPage.getByTestId("whatif").scrollIntoViewIfNeeded();
await gifPage.getByLabel("What-if scenario").fill("cut food delivery 30%");
await grab(700);
await gifPage.getByRole("button", { name: "Simulate" }).click();
for (let i = 0; i < 6; i++) {
  await gifPage.waitForTimeout(150);
  await grab(150);
}
await gifPage.getByRole("button", { name: "Reduce dining by 20%" }).click();
for (let i = 0; i < 6; i++) {
  await gifPage.waitForTimeout(150);
  await grab(150);
}
await grab(2200);

const gif = GIFEncoder();
for (const f of frames) {
  const png = PNG.sync.read(f.buf);
  const palette = quantize(png.data, 256, { format: "rgb565" });
  const index = applyPalette(png.data, palette, "rgb565");
  gif.writeFrame(index, png.width, png.height, { palette, delay: f.delay });
}
gif.finish();
writeFileSync(`${OUT}/demo.gif`, gif.bytes());

// --- Full dashboard screenshots
await page.goto(`${BASE}/dashboard`);
await page.waitForSelector("[data-testid=empty-state]");
await page.screenshot({ path: `${OUT}/empty-state.png` });
await page.getByRole("button", { name: "Load sample data" }).last().click();
await page.waitForSelector("[data-testid=insight-card]");
await wait(2000);
await page.screenshot({ path: `${OUT}/dashboard.png` });
await page.getByTestId("whatif").scrollIntoViewIfNeeded();
await page.getByRole("button", { name: "Cut food delivery 30%" }).click();
await page.getByRole("button", { name: "Reduce dining by 20%" }).click();
await wait(1500);
await page.addStyleTag({ content: "header{position:static!important}" });
await page.getByTestId("whatif").screenshot({ path: `${OUT}/what-if.png` });
await page.getByTestId("insights").screenshot({ path: `${OUT}/insights.png` });
await page.getByTestId("transactions").screenshot({ path: `${OUT}/transactions.png` });

const mobile = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: "dark" })).newPage();
await mobile.goto(`${BASE}/dashboard?sample=1`);
await mobile.waitForSelector("[data-testid=insight-card]");
await mobile.waitForTimeout(1800);
await mobile.screenshot({ path: `${OUT}/mobile.png` });

await browser.close();
console.log(`Saved screenshots and demo.gif (${frames.length} frames, ${(readFileSync(`${OUT}/demo.gif`).length / 1e6).toFixed(1)} MB)`);
