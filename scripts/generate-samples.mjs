// Generates deterministic sample bank statements into public/samples/.
// Run: node scripts/generate-samples.mjs
import { writeFileSync, mkdirSync } from "node:fs";

let seed = 42;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (a, b) => Math.round((a + rand() * (b - a)) * 100) / 100;

const MONTHS = ["2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10"];
const day = (m, d) => `${m}-${String(d).padStart(2, "0")}`;

const checking = [];
const card = [];

MONTHS.forEach((m, i) => {
  // Checking account: salary, rent, utilities, transfers
  checking.push([day(m, 1), "ACME CORP PAYROLL DIRECT DEP", 2780]);
  checking.push([day(m, 15), "ACME CORP PAYROLL DIRECT DEP", 2780]);
  if (i % 2 === 1) checking.push([day(m, 20), "FREELANCE INVOICE #10" + i, between(400, 900)]);
  checking.push([day(m, 2), "PARKVIEW APARTMENTS RENT", -2100]);
  checking.push([day(m, 6), "CITY POWER CO ELECTRIC BILL", -between(70, 130)]);
  checking.push([day(m, 8), "XFINITY INTERNET", -79.99]);
  checking.push([day(m, 9), "T-MOBILE WIRELESS", -65]);
  checking.push([day(m, 25), "TRANSFER TO SAVINGS ACCT", -800]);
  checking.push([day(m, 27), "CREDIT CARD PAYMENT AUTOPAY", -between(1500, 2100)]);
  checking.push([day(m, 12), "ZELLE TO ALEX ROOMMATE UTIL", -between(30, 60)]);

  // Credit card: everyday spending
  const deliveryBoost = 1 + i * 0.18; // food delivery creeps up month after month
  for (let k = 0; k < 5; k++) card.push([day(m, 3 + k * 5), pick(["WHOLE FOODS MARKET", "TRADER JOE'S #552", "SAFEWAY STORE 1123", "COSTCO WHSE #0420"]), between(45, 140)]);
  const deliveries = Math.round(4 + i * 1.2);
  for (let k = 0; k < deliveries; k++) card.push([day(m, 2 + ((k * 4) % 27)), pick(["UBER EATS ORDER", "DOORDASH*DASHPASS ORDER", "GRUBHUB*THAI SPICE"]), between(18, 42) * deliveryBoost]);
  for (let k = 0; k < 4; k++) card.push([day(m, 4 + k * 6), pick(["STARBUCKS STORE 8812", "CHIPOTLE 1904", "SUSHI ZEN RESTAURANT", "BLUE HERON ROASTERS", "NOVA RAMEN HOUSE"]), between(6, 65)]);
  for (let k = 0; k < 3; k++) card.push([day(m, 5 + k * 8), pick(["UBER TRIP HELP.UBER.COM", "LYFT RIDE", "SHELL OIL 5542"]), between(12, 55)]);
  card.push([day(m, 10), pick(["AMAZON.COM*MK3L2", "AMZN MKTP US*2K1", "TARGET 00012", "IKEA SEATTLE"]), between(25, 220)]);
  card.push([day(m, 21), pick(["AMAZON.COM*AB12", "ZARA USA", "LUMEN BOOKSHOP"]), between(20, 120)]);
  card.push([day(m, 5), "NETFLIX.COM", 15.49]);
  card.push([day(m, 7), "SPOTIFY USA", 11.99]);
  card.push([day(m, 11), "ICLOUD STORAGE APPLE.COM/BILL", 2.99]);
  card.push([day(m, 14), "ZEPHYR LABS*CLOUD PLAN", 24]);
  card.push([day(m, 3), "PLANET FITNESS GYM", 24.99]);
  if (i % 2 === 0) card.push([day(m, 18), "KESTREL YOGA STUDIO", 35]);
  if (i % 3 === 0) card.push([day(m, 19), "CVS PHARMACY #3321", between(12, 48)]);
  if (i % 2 === 1) card.push([day(m, 23), pick(["AMC THEATRES 4401", "STEAM PURCHASE", "GLIMMER ARCADE"]), between(15, 60)]);
  if (i === 2) card.push([day(m, 16), "DELTA AIR LINES", 412.6]);
  if (i === 2) card.push([day(m, 17), "AIRBNB * HMQ2KD", 538.2]);
  if (i === 4) card.push([day(m, 13), "PAWS & CLAWS VET CLINIC", 186]);
  card.push([day(m, 26), "SQ *MAPLE & CO", between(14, 40)]);
});

const fmtUS = (iso) => {
  const [y, mo, d] = iso.split("-");
  return `${mo}/${d}/${y}`;
};
const q = (s) => (/[",]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

mkdirSync("public/samples", { recursive: true });
checking.sort((a, b) => a[0].localeCompare(b[0]));
card.sort((a, b) => a[0].localeCompare(b[0]));

writeFileSync(
  "public/samples/checking.csv",
  ["Date,Description,Amount", ...checking.map(([d, desc, a]) => `${d},${q(desc)},${a.toFixed(2)}`)].join("\n") + "\n",
);
writeFileSync(
  "public/samples/credit-card.csv",
  [
    "Transaction Date,Merchant,Debit,Credit",
    ...card.map(([d, desc, a]) => `${fmtUS(d)},${q(desc)},${a.toFixed(2)},`),
    `${fmtUS("2026-08-02")},AMAZON.COM REFUND,,34.99`,
  ].join("\n") + "\n",
);
console.log(`checking.csv: ${checking.length} rows, credit-card.csv: ${card.length + 1} rows`);
