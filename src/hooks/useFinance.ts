"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { parseStatement } from "@/lib/csv";
import { importTransactions, makeId, txnKey } from "@/lib/pipeline";
import { clearAll, DEFAULT_SETTINGS, loadSettings, loadTransactions, saveSettings, saveTransactions, type Settings } from "@/lib/storage";
import type { AiMode, NewTransaction, Transaction } from "@/lib/types";

export const SAMPLE_FILES = ["checking.csv", "credit-card.csv"];

export interface Toast {
  id: number;
  text: string;
  tone: "info" | "success" | "error";
}

export function useFinance() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [aiMode, setAiMode] = useState<AiMode | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const txRef = useRef<Transaction[]>([]);

  const notify = useCallback((text: string, tone: Toast["tone"] = "info") => {
    setToast({ id: Date.now(), text, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  const commit = useCallback((next: Transaction[]) => {
    const sorted = [...next].sort((a, b) => b.date.localeCompare(a.date));
    txRef.current = sorted;
    setTransactions(sorted);
    void saveTransactions(sorted);
  }, []);

  const ingest = useCallback(
    async (rows: NewTransaction[], label: string) => {
      const result = await importTransactions(rows, txRef.current);
      if (result.mode) setAiMode(result.mode);
      commit([...txRef.current, ...result.added]);
      const parts = [`Imported ${result.added.length} transactions from ${label}`];
      if (result.aiCount) parts.push(`${result.aiCount} categorised by ${result.mode === "claude" ? "Claude" : "demo AI"}`);
      if (result.duplicates) parts.push(`${result.duplicates} duplicates skipped`);
      notify(parts.join(" · "), "success");
      return result;
    },
    [commit, notify],
  );

  const loadSample = useCallback(async () => {
    setBusy("Loading sample statements…");
    try {
      const rows: NewTransaction[] = [];
      for (const f of SAMPLE_FILES) {
        const text = await fetch(`/samples/${f}`).then((r) => r.text());
        rows.push(...parseStatement(text, f).transactions);
      }
      await ingest(rows, "sample data");
    } catch {
      notify("Could not load sample data.", "error");
    } finally {
      setBusy(null);
    }
  }, [ingest, notify]);

  const importFiles = useCallback(
    async (files: File[]) => {
      const csvs = files.filter((f) => /\.(csv|txt)$/i.test(f.name) || f.type.includes("csv"));
      if (!csvs.length) {
        notify("Please choose a .csv bank statement.", "error");
        return;
      }
      setBusy(`Categorising ${csvs.length > 1 ? `${csvs.length} files` : csvs[0].name}…`);
      try {
        const rows: NewTransaction[] = [];
        const errors: string[] = [];
        for (const f of csvs) {
          const parsed = parseStatement(await f.text(), f.name);
          if (parsed.error) errors.push(`${f.name}: ${parsed.error}`);
          rows.push(...parsed.transactions);
        }
        if (!rows.length) notify(errors[0] ?? "No transactions found in that file.", "error");
        else await ingest(rows, csvs.length > 1 ? `${csvs.length} files` : csvs[0].name);
      } finally {
        setBusy(null);
      }
    },
    [ingest, notify],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [t, s] = await Promise.all([loadTransactions(), loadSettings()]);
      if (cancelled) return;
      txRef.current = t;
      setTransactions(t);
      setSettings(s);
      setReady(true);
      const params = new URLSearchParams(window.location.search);
      if (params.get("plan") === "premium") {
        notify("Premium checkout is coming soon. Enjoy every Premium feature free during the beta!", "info");
      }
      if (params.get("sample") === "1" && t.length === 0) void loadSample();
      fetch("/api/status")
        .then((r) => r.json())
        .then((j: { mode: AiMode }) => !cancelled && setAiMode(j.mode))
        .catch(() => !cancelled && setAiMode("demo"));
    })();
    return () => {
      cancelled = true;
    };
  }, [loadSample, notify]);

  const addManual = useCallback(
    (t: Omit<NewTransaction, "source" | "origin">) => {
      const row: Transaction = { ...t, id: makeId(), source: "manual", origin: "manual" };
      if (txRef.current.some((x) => txnKey(x) === txnKey(row))) {
        notify("That transaction already exists.", "error");
        return false;
      }
      commit([...txRef.current, row]);
      notify(`Added "${t.description}"`, "success");
      return true;
    },
    [commit, notify],
  );

  /** Re-categorise one row and teach the twin: every row from the same merchant follows. */
  const updateCategory = useCallback(
    (id: string, category: string) => {
      const target = txRef.current.find((t) => t.id === id);
      if (!target) return;
      const merchant = target.description.toLowerCase();
      let count = 0;
      commit(
        txRef.current.map((t) => {
          if (t.id === id || (t.description.toLowerCase() === merchant && t.source !== "manual")) {
            count++;
            return { ...t, category, source: "manual" };
          }
          return t;
        }),
      );
      if (count > 1) notify(`Updated ${count} "${target.description}" transactions to ${category}`, "success");
    },
    [commit, notify],
  );

  const remove = useCallback((id: string) => commit(txRef.current.filter((t) => t.id !== id)), [commit]);

  const clear = useCallback(async () => {
    await clearAll();
    txRef.current = [];
    setTransactions([]);
    notify("All local data deleted from this browser.", "info");
  }, [notify]);

  const updateSettings = useCallback((s: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...s };
      void saveSettings(next);
      return next;
    });
  }, []);

  return {
    transactions,
    settings,
    ready,
    busy,
    aiMode,
    toast,
    dismissToast: () => setToast(null),
    loadSample,
    importFiles,
    addManual,
    updateCategory,
    remove,
    clear,
    updateSettings,
  };
}

export type FinanceStore = ReturnType<typeof useFinance>;
