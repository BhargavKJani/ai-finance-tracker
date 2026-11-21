import type { NewTransaction } from "./types";

/** RFC 4180-ish CSV parser: quotes, escaped quotes, commas/newlines in quotes, CRLF. */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/^﻿/, "");

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f.trim() !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows.map((r) => r.map((f) => f.trim()));
}

/** Parses "1,234.56", "$-12.00", "(45.00)", "€12,50"-free variants into a number. */
export function parseAmount(raw: string): number | null {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (/\s?(DR|CR)$/i.test(s)) {
    if (/DR$/i.test(s)) negative = true;
    s = s.replace(/\s?(DR|CR)$/i, "");
  }
  s = s.replace(/[^0-9.\-]/g, "");
  if (s.startsWith("-")) {
    negative = !negative;
    s = s.slice(1);
  }
  if (!s || s === ".") return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.round((negative ? -n : n) * 100) / 100;
}

export type DateOrder = "DMY" | "MDY";

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

const pad = (n: number) => String(n).padStart(2, "0");

function isoFrom(y: number, m: number, d: number): string | null {
  if (y < 100) y += 2000;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCMonth() !== m - 1) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** Guesses day/month order from a list of slash/dash dates. */
export function detectDateOrder(values: string[]): DateOrder {
  for (const v of values) {
    const m = v.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})/);
    if (!m) continue;
    if (Number(m[1]) > 12) return "DMY";
    if (Number(m[2]) > 12) return "MDY";
  }
  return "MDY";
}

export function parseDate(raw: string, order: DateOrder = "MDY"): string | null {
  const s = raw.trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return isoFrom(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})/);
  if (m) {
    const [a, b, y] = [+m[1], +m[2], +m[3]];
    return order === "DMY" ? isoFrom(y, b, a) : isoFrom(y, a, b);
  }
  // "21 Nov 2026" / "21-Nov-26"
  m = s.match(/^(\d{1,2})[\s\-]([A-Za-z]{3})[A-Za-z]*[\s\-,]+(\d{2,4})/);
  if (m && MONTHS[m[2].toLowerCase()]) return isoFrom(+m[3], MONTHS[m[2].toLowerCase()], +m[1]);
  // "Nov 21, 2026"
  m = s.match(/^([A-Za-z]{3})[A-Za-z]*\.?\s+(\d{1,2}),?\s+(\d{2,4})/);
  if (m && MONTHS[m[1].toLowerCase()]) return isoFrom(+m[3], MONTHS[m[1].toLowerCase()], +m[2]);
  return null;
}

export interface ColumnMap {
  date: number;
  description: number;
  amount?: number;
  debit?: number;
  credit?: number;
  type?: number;
}

export function detectColumns(header: string[]): ColumnMap | null {
  const h = header.map((x) => x.toLowerCase().trim());
  const find = (re: RegExp, exclude: number[] = []) => h.findIndex((x, i) => re.test(x) && !exclude.includes(i));
  const date = find(/date|posted|time/);
  if (date < 0) return null;
  const description = find(/desc|merchant|payee|narrat|details|memo|particular|name|reference/, [date]);
  if (description < 0) return null;
  const debit = find(/debit|withdraw|money out|paid out|outflow/);
  const credit = find(/credit(?! card)|deposit|money in|paid in|inflow/);
  const amount = find(/^amount|amount$|^value|transaction amount/);
  const type = find(/^type$|dr\/cr|debit\/credit|transaction type/);
  if (amount >= 0) return { date, description, amount, type: type >= 0 ? type : undefined };
  if (debit >= 0 || credit >= 0) {
    return { date, description, debit: debit >= 0 ? debit : undefined, credit: credit >= 0 ? credit : undefined };
  }
  return null;
}

export interface StatementParseResult {
  transactions: NewTransaction[];
  skipped: number;
  error?: string;
}

/** Converts raw CSV text from a bank statement into uncategorised transactions. */
export function parseStatement(text: string, origin = "upload.csv"): StatementParseResult {
  const rows = parseCSV(text);
  if (rows.length < 2) return { transactions: [], skipped: 0, error: "The file has no data rows." };
  const cols = detectColumns(rows[0]);
  if (!cols) {
    return {
      transactions: [],
      skipped: rows.length - 1,
      error: "Could not find Date, Description and Amount (or Debit/Credit) columns.",
    };
  }
  const body = rows.slice(1);
  const order = detectDateOrder(body.map((r) => r[cols.date] ?? ""));
  const transactions: NewTransaction[] = [];
  let skipped = 0;

  for (const r of body) {
    const date = parseDate(r[cols.date] ?? "", order);
    const description = (r[cols.description] ?? "").replace(/\s+/g, " ").trim();
    let amount: number | null = null;
    if (cols.amount !== undefined) {
      amount = parseAmount(r[cols.amount] ?? "");
      if (amount !== null && cols.type !== undefined) {
        const t = (r[cols.type] ?? "").toLowerCase();
        if (/^(debit|dr|withdrawal|purchase)/.test(t)) amount = -Math.abs(amount);
        else if (/^(credit|cr|deposit)/.test(t)) amount = Math.abs(amount);
      }
    } else {
      const debit = cols.debit !== undefined ? parseAmount(r[cols.debit] ?? "") : null;
      const credit = cols.credit !== undefined ? parseAmount(r[cols.credit] ?? "") : null;
      if (debit) amount = -Math.abs(debit);
      else if (credit) amount = Math.abs(credit);
    }
    if (!date || !description || amount === null || amount === 0) {
      skipped++;
      continue;
    }
    transactions.push({ date, description, amount, category: "Other", source: "fallback", origin });
  }
  return { transactions, skipped };
}

export function toCSV(rows: { date: string; description: string; amount: number; category: string }[]): string {
  const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return [
    "Date,Description,Amount,Category",
    ...rows.map((r) => [r.date, esc(r.description), r.amount.toFixed(2), esc(r.category)].join(",")),
  ].join("\n");
}
