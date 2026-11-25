"use client";

import { AnimatePresence, motion } from "motion/react";
import { Database, Download, FileUp, Loader2, Lock, Plus, Sparkles, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { categoryBreakdown, categoryByMonth, forecastNextMonth, monthLabel, monthlyTotals, summarize } from "@/lib/analytics";
import { toCSV } from "@/lib/csv";
import { CURRENCIES } from "@/lib/format";
import { buildSnapshot } from "@/lib/insights";
import { useFinance } from "@/hooks/useFinance";
import { Logo } from "../Logo";
import { AccountButton } from "../AccountButton";
import { AddTransaction } from "./AddTransaction";
import { CategoryDonut, MonthlyChart, TrendChart } from "./Charts";
import { Insights } from "./Insights";
import { Kpis } from "./Kpis";
import { Badge, btn, btnPrimary, field, Panel } from "./primitives";
import { Transactions } from "./Transactions";
import { WhatIf } from "./WhatIf";

export function Dashboard() {
  const f = useFinance();
  const { transactions, settings } = f;
  const currency = settings.currency;
  const fileRef = useRef<HTMLInputElement>(null);
  const [adding, setAdding] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [month, setMonth] = useState<string | null>(null);

  const totals = useMemo(() => monthlyTotals(transactions), [transactions]);
  const summary = useMemo(() => summarize(transactions), [transactions]);
  const forecast = useMemo(() => forecastNextMonth(transactions), [transactions]);
  const byMonth = useMemo(() => categoryByMonth(transactions), [transactions]);
  const snapshot = useMemo(() => buildSnapshot(transactions, currency), [transactions, currency]);
  const months = totals.map((t) => t.month);
  const activeMonth = month && months.includes(month) ? month : summary?.latestMonth;
  const breakdown = useMemo(() => categoryBreakdown(transactions, activeMonth), [transactions, activeMonth]);
  const topCats = useMemo(
    () => categoryBreakdown(transactions).filter((c) => c.category !== "Housing").slice(0, 5).map((c) => c.category),
    [transactions],
  );

  const exportCsv = () => {
    const blob = new Blob([toCSV(transactions)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "moneytwin-transactions.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const hasData = transactions.length > 0;

  return (
    <div
      className="flex min-h-screen flex-col"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void f.importFiles([...e.dataTransfer.files]);
      }}
    >
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        multiple
        hidden
        data-testid="file-input"
        onChange={(e) => {
          void f.importFiles([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />

      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#05060f]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Logo />
          <div className="hidden items-center gap-2 md:flex">
            <Badge tone="green">
              <Lock className="h-3 w-3" /> Local only
            </Badge>
            {f.aiMode && (
              <Badge tone={f.aiMode === "claude" ? "violet" : "amber"}>
                <Sparkles className="h-3 w-3" /> {f.aiMode === "claude" ? "Claude connected" : "Demo AI"}
              </Badge>
            )}
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <AccountButton />
            <select aria-label="Currency" className={`${field} py-1.5`} value={currency} onChange={(e) => f.updateSettings({ currency: e.target.value })}>
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            {hasData && (
              <>
                <button className={btn} onClick={exportCsv} aria-label="Export CSV">
                  <Download className="h-4 w-4" />
                </button>
                <button
                  className={btn}
                  aria-label="Delete all data"
                  onClick={() => {
                    if (confirm("Delete all transactions stored in this browser? This cannot be undone.")) void f.clear();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
            <button className={btn} onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add</span>
            </button>
            <button className={btn} onClick={() => void f.loadSample()} disabled={!!f.busy}>
              <Database className="h-4 w-4" /> <span className="hidden sm:inline">Load sample data</span>
            </button>
            <button className={btnPrimary} onClick={() => fileRef.current?.click()} disabled={!!f.busy}>
              <FileUp className="h-4 w-4" /> Upload CSV
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-6 sm:space-y-5 sm:px-6">
        {!f.ready ? (
          <div className="grid gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="shimmer h-28 rounded-2xl" />
            ))}
          </div>
        ) : !hasData ? (
          <EmptyState onUpload={() => fileRef.current?.click()} onSample={() => void f.loadSample()} busy={!!f.busy} />
        ) : (
          summary && (
            <>
              <Kpis summary={summary} forecast={forecast} currency={currency} />
              <div className="grid gap-4 sm:gap-5 lg:grid-cols-5">
                <Panel className="lg:col-span-3" title="Income vs spending" subtitle="Monthly totals · ✦ forecast for next month" delay={0.05}>
                  <MonthlyChart totals={totals} forecast={forecast} currency={currency} />
                </Panel>
                <Panel
                  className="lg:col-span-2"
                  title="Where it went"
                  subtitle={activeMonth ? monthLabel(activeMonth, "long") : ""}
                  delay={0.1}
                  action={
                    <select aria-label="Breakdown month" className={`${field} py-1 text-xs`} value={activeMonth} onChange={(e) => setMonth(e.target.value)}>
                      {[...months].reverse().map((m) => (
                        <option key={m} value={m}>
                          {monthLabel(m, "long")}
                        </option>
                      ))}
                    </select>
                  }
                >
                  <CategoryDonut breakdown={breakdown} currency={currency} />
                </Panel>
              </div>
              <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
                {snapshot && <Insights snapshot={snapshot} />}
                <Panel title="Category trends" subtitle="Top flexible categories over time" delay={0.15}>
                  <TrendChart byMonth={byMonth} forecast={forecast} categories={topCats} currency={currency} />
                </Panel>
              </div>
              {forecast && <WhatIf forecast={forecast} currency={currency} />}
              <Transactions transactions={transactions} currency={currency} onCategory={f.updateCategory} onDelete={f.remove} />
            </>
          )
        )}
      </main>

      <AddTransaction open={adding} onClose={() => setAdding(false)} onAdd={f.addManual} />

      <AnimatePresence>
        {dragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-4 z-50 grid place-items-center rounded-3xl border-2 border-dashed border-cyan-300/60 bg-cyan-400/5 backdrop-blur-sm"
          >
            <p className="font-[family-name:var(--font-display)] text-2xl font-semibold text-cyan-100">Drop your bank CSV to import</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(f.busy || f.toast) && (
          <motion.div
            key="toast"
            role="status"
            data-testid="toast"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={f.dismissToast}
            className={`glass fixed bottom-5 !bg-slate-950/90 left-1/2 z-50 flex max-w-[92vw] -translate-x-1/2 items-center gap-2 rounded-2xl px-4 py-3 text-sm ${
              f.toast?.tone === "error" && !f.busy ? "border-rose-400/40" : f.toast?.tone === "success" && !f.busy ? "border-emerald-400/40" : ""
            }`}
          >
            {f.busy && <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />}
            {f.busy ?? f.toast?.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ onUpload, onSample, busy }: { onUpload: () => void; onSample: () => void; busy: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass mx-auto mt-6 max-w-2xl rounded-3xl p-10 text-center"
      data-testid="empty-state"
    >
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400/30 to-violet-500/30 shadow-[0_0_50px_-10px_rgba(34,211,238,0.8)]">
        <FileUp className="h-7 w-7 text-cyan-200" />
      </div>
      <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl font-bold">Build your money&apos;s digital twin</h1>
      <p className="mx-auto mt-3 max-w-md text-[var(--color-muted)]">
        Drag a bank statement CSV anywhere on this page, or try it instantly with six months of realistic sample data.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button className={btnPrimary} onClick={onSample} disabled={busy}>
          <Database className="h-4 w-4" /> Load sample data
        </button>
        <button className={btn} onClick={onUpload} disabled={busy}>
          <FileUp className="h-4 w-4" /> Upload CSV
        </button>
      </div>
      <p className="mt-6 text-xs text-[var(--color-muted)]">
        Supports <code>Date, Description, Amount</code> and <code>Date, Merchant, Debit, Credit</code> layouts. Everything is stored in your browser only.
      </p>
    </motion.div>
  );
}
