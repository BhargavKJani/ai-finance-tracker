import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { detectColumns, detectDateOrder, parseAmount, parseCSV, parseDate, parseStatement, toCSV } from "@/lib/csv";

describe("parseCSV", () => {
  it("handles quotes, escaped quotes, embedded commas/newlines and CRLF", () => {
    const rows = parseCSV('a,b,c\r\n1,"x, y","he said ""hi"""\r\n2,"multi\nline",z\n');
    expect(rows).toEqual([
      ["a", "b", "c"],
      ["1", "x, y", 'he said "hi"'],
      ["2", "multi\nline", "z"],
    ]);
  });
  it("strips a BOM and skips blank lines", () => {
    expect(parseCSV("﻿a,b\n\n1,2\n")).toEqual([["a", "b"], ["1", "2"]]);
  });
});

describe("parseAmount", () => {
  it.each([
    ["1,234.56", 1234.56],
    ["$-12.00", -12],
    ["-$12.00", -12],
    ["(45.10)", -45.1],
    ["€ 9.99", 9.99],
    ["100.00 DR", -100],
    ["100.00 CR", 100],
  ])("%s → %d", (raw, expected) => expect(parseAmount(raw)).toBe(expected));
  it("returns null for junk", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("n/a")).toBeNull();
  });
});

describe("dates", () => {
  it("detects DMY when a first part exceeds 12", () => {
    expect(detectDateOrder(["01/02/2026", "25/02/2026"])).toBe("DMY");
    expect(detectDateOrder(["02/25/2026"])).toBe("MDY");
  });
  it("parses common formats", () => {
    expect(parseDate("2026-11-03")).toBe("2026-11-03");
    expect(parseDate("11/03/2026", "MDY")).toBe("2026-11-03");
    expect(parseDate("03/11/2026", "DMY")).toBe("2026-11-03");
    expect(parseDate("3 Nov 2026")).toBe("2026-11-03");
    expect(parseDate("Nov 3, 2026")).toBe("2026-11-03");
    expect(parseDate("31/02/2026", "DMY")).toBeNull();
  });
});

describe("detectColumns", () => {
  it("finds amount-style statements", () => {
    expect(detectColumns(["Date", "Description", "Amount"])).toMatchObject({ date: 0, description: 1, amount: 2 });
  });
  it("finds debit/credit-style statements", () => {
    expect(detectColumns(["Transaction Date", "Merchant", "Debit", "Credit"])).toMatchObject({
      date: 0,
      description: 1,
      debit: 2,
      credit: 3,
    });
  });
  it("returns null when columns are missing", () => {
    expect(detectColumns(["foo", "bar"])).toBeNull();
  });
});

describe("parseStatement", () => {
  it("parses an amount + type statement", () => {
    const csv = "Posted Date,Payee,Amount,Type\n2026-01-02,Coffee,4.50,DEBIT\n2026-01-03,Pay,1000,CREDIT\n";
    const { transactions } = parseStatement(csv);
    expect(transactions.map((t) => t.amount)).toEqual([-4.5, 1000]);
  });
  it("skips invalid rows and reports them", () => {
    const { transactions, skipped } = parseStatement("Date,Description,Amount\nbad,X,1\n2026-01-01,,1\n2026-01-01,Ok,-3\n");
    expect(transactions).toHaveLength(1);
    expect(skipped).toBe(2);
  });
  it("errors for unknown layouts", () => {
    expect(parseStatement("a,b\n1,2").error).toMatch(/Could not find/);
  });
  it("parses both bundled sample files", () => {
    const checking = parseStatement(readFileSync("public/samples/checking.csv", "utf8"), "checking.csv");
    const card = parseStatement(readFileSync("public/samples/credit-card.csv", "utf8"), "credit-card.csv");
    expect(checking.skipped).toBe(0);
    expect(card.skipped).toBe(0);
    expect(checking.transactions.length).toBeGreaterThan(40);
    expect(card.transactions.every((t) => /^2026-\d\d-\d\d$/.test(t.date))).toBe(true);
    expect(card.transactions.filter((t) => t.amount > 0)).toHaveLength(1); // the refund
  });
  it("round-trips through toCSV", () => {
    const out = toCSV([{ date: "2026-01-01", description: 'A, "B"', amount: -1, category: "Other" }]);
    expect(parseCSV(out)[1]).toEqual(["2026-01-01", 'A, "B"', "-1.00", "Other"]);
  });
});
