"use client";

import { Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { CATEGORY_NAMES, getCategory } from "@/lib/categories";
import { formatMoney } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { Badge, field, input, Panel } from "./primitives";

const SOURCE_BADGE = {
  rule: <Badge tone="muted">rule</Badge>,
  ai: <Badge tone="violet">AI</Badge>,
  manual: <Badge tone="green">you</Badge>,
  fallback: <Badge tone="amber">?</Badge>,
} as const;

const PAGE = 25;

export function Transactions({
  transactions,
  currency,
  onCategory,
  onDelete,
}: {
  transactions: Transaction[];
  currency: string;
  onCategory: (id: string, category: string) => void;
  onDelete: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [limit, setLimit] = useState(PAGE);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return transactions.filter(
      (t) => (cat === "All" || t.category === cat) && (!needle || t.description.toLowerCase().includes(needle)),
    );
  }, [transactions, q, cat]);

  return (
    <Panel
      testId="transactions"
      title="Transactions"
      subtitle={`${filtered.length} of ${transactions.length} · change a category and every matching merchant follows`}
      delay={0.25}
      action={
        <div className="flex gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input aria-label="Search transactions" className={`${input} w-44 pl-8`} placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select aria-label="Filter by category" className={field} value={cat} onChange={(e) => setCat(e.target.value)}>
            <option>All</option>
            {CATEGORY_NAMES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      }
    >
      <div className="-mx-2 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="text-left text-xs text-[var(--color-muted)]">
            <tr>
              <th className="px-2 py-2 font-medium">Date</th>
              <th className="px-2 py-2 font-medium">Description</th>
              <th className="px-2 py-2 font-medium">Category</th>
              <th className="px-2 py-2 text-right font-medium">Amount</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, limit).map((t) => (
              <tr key={t.id} className="group border-t border-white/5 transition hover:bg-white/[0.03]" data-testid="txn-row">
                <td className="px-2 py-2 whitespace-nowrap text-xs text-[var(--color-muted)] tabular-nums">{t.date}</td>
                <td className="max-w-[260px] truncate px-2 py-2" title={t.description}>
                  {t.description}
                </td>
                <td className="px-2 py-1.5">
                  <div className="flex items-center gap-2">
                    <span>{getCategory(t.category).emoji}</span>
                    <select
                      aria-label={`Category for ${t.description}`}
                      value={t.category}
                      onChange={(e) => onCategory(t.id, e.target.value)}
                      className="rounded-lg border border-transparent bg-transparent py-1 text-sm outline-none hover:border-white/10 focus:border-cyan-300/40 [&>option]:bg-slate-900"
                    >
                      {CATEGORY_NAMES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                    {SOURCE_BADGE[t.source]}
                  </div>
                </td>
                <td className={`px-2 py-2 text-right whitespace-nowrap tabular-nums ${t.amount > 0 ? "text-emerald-300" : ""}`}>
                  {t.amount > 0 ? "+" : ""}
                  {formatMoney(t.amount, currency, { decimals: true })}
                </td>
                <td className="px-1">
                  <button
                    aria-label={`Delete ${t.description}`}
                    onClick={() => onDelete(t.id)}
                    className="rounded-md p-1.5 text-slate-500 opacity-0 transition group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-300 focus:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length > limit && (
        <button onClick={() => setLimit((l) => l + PAGE * 2)} className="mt-3 w-full rounded-xl border border-white/10 py-2 text-xs text-[var(--color-muted)] hover:bg-white/5">
          Show more ({filtered.length - limit} remaining)
        </button>
      )}
    </Panel>
  );
}
