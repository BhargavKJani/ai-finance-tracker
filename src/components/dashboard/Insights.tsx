"use client";

import { AlertTriangle, Info, Lightbulb, RefreshCw, Sparkles, Trophy } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FinanceSnapshot } from "@/lib/insights";
import type { AiMode, Insight, InsightKind } from "@/lib/types";
import { Badge, btn, Panel } from "./primitives";

const KIND: Record<InsightKind, { icon: typeof Info; ring: string; text: string }> = {
  warning: { icon: AlertTriangle, ring: "from-amber-400/25", text: "text-amber-300" },
  tip: { icon: Lightbulb, ring: "from-cyan-400/25", text: "text-cyan-300" },
  win: { icon: Trophy, ring: "from-emerald-400/25", text: "text-emerald-300" },
  info: { icon: Info, ring: "from-violet-400/25", text: "text-violet-300" },
};

export function Insights({ snapshot }: { snapshot: FinanceSnapshot }) {
  const [items, setItems] = useState<Insight[] | null>(null);
  const [mode, setMode] = useState<AiMode | null>(null);
  const [loading, setLoading] = useState(false);
  const key = JSON.stringify(snapshot);
  const reqId = useRef(0);

  const load = useCallback(async (body: string) => {
    const id = ++reqId.current;
    setLoading(true);
    try {
      const res = await fetch("/api/insights", { method: "POST", headers: { "Content-Type": "application/json" }, body });
      const json = (await res.json()) as { mode: AiMode; insights: Insight[] };
      if (id !== reqId.current) return;
      setItems(json.insights);
      setMode(json.mode);
    } catch {
      if (id === reqId.current) setItems([]);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void load(key), 350);
    return () => clearTimeout(t);
  }, [key, load]);

  return (
    <Panel
      testId="insights"
      title={
        <span className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-300" /> AI insights
        </span>
      }
      subtitle="Generated from aggregated totals only, never raw transactions."
      action={
        <div className="flex items-center gap-2">
          {mode && <Badge tone={mode === "claude" ? "violet" : "amber"}>{mode === "claude" ? "Claude Sonnet" : "Demo mode"}</Badge>}
          <button className={btn} onClick={() => void load(key)} disabled={loading} aria-label="Refresh insights">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      }
      delay={0.15}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {!items &&
          Array.from({ length: 4 }, (_, i) => <div key={i} className="shimmer h-28 rounded-2xl" />)}
        {items?.map((it, i) => {
          const k = KIND[it.kind] ?? KIND.info;
          return (
            <motion.article
              key={`${it.title}-${i}`}
              data-testid="insight-card"
              initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className={`relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br ${k.ring} to-transparent p-4`}
            >
              <div className="flex items-start gap-3">
                <k.icon className={`mt-0.5 h-4 w-4 shrink-0 ${k.text}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold">{it.title}</h3>
                    {it.metric && <span className={`shrink-0 text-xs font-semibold tabular-nums ${k.text}`}>{it.metric}</span>}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">{it.body}</p>
                </div>
              </div>
            </motion.article>
          );
        })}
        {items?.length === 0 && <p className="text-sm text-[var(--color-muted)]">No insights yet. Add a bit more data.</p>}
      </div>
    </Panel>
  );
}
