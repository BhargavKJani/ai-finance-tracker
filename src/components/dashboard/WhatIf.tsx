"use client";

import { AnimatePresence, motion } from "motion/react";
import { RotateCcw, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { Forecast } from "@/lib/analytics";
import { getCategory } from "@/lib/categories";
import { formatMoney } from "@/lib/format";
import { parseWhatIf, projectSavings, simulate, type Cuts } from "@/lib/whatif";
import { SavingsChart } from "./Charts";
import { AnimatedNumber, btn, input, Panel } from "./primitives";

const PRESETS = ["Cut food delivery 30%", "Reduce dining by 20%", "Cancel subscriptions", "Spend half on shopping"];

export function WhatIf({ forecast, currency }: { forecast: Forecast; currency: string }) {
  const [cuts, setCuts] = useState<Cuts>({});
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sim = useMemo(() => simulate(forecast.byCategory, cuts), [forecast, cuts]);
  const projection = useMemo(() => projectSavings(forecast.net, sim.monthlySavings), [forecast.net, sim.monthlySavings]);
  // Fixed costs like rent are rarely negotiable month to month; show flexible ones first.
  const adjustable = sim.byCategory.filter((c) => !["Housing"].includes(c.category)).slice(0, 7);

  const apply = (value: string) => {
    const parsed = parseWhatIf(value);
    if (!parsed) {
      setError('Try something like "cut food delivery 30%" or "reduce dining by 20%".');
      return;
    }
    if (!forecast.byCategory[parsed.category]) {
      setError(`No ${parsed.category} spending in your forecast to cut.`);
      return;
    }
    setError(null);
    setCuts((c) => ({ ...c, [parsed.category]: parsed.percent }));
    setText("");
  };

  const m = (n: number) => formatMoney(n, currency);

  return (
    <Panel
      testId="whatif"
      title={
        <span className="flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-cyan-300" /> What-if simulator
        </span>
      }
      subtitle="Change a habit, see the future. Based on next month's forecast."
      action={
        Object.keys(cuts).length > 0 && (
          <button className={btn} onClick={() => setCuts({})}>
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        )
      }
      delay={0.2}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply(text);
        }}
        className="flex gap-2"
      >
        <input
          aria-label="What-if scenario"
          className={input}
          placeholder='e.g. "cut food delivery 30%"'
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className={btn}>
          Simulate
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button key={p} onClick={() => apply(p)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[var(--color-muted)] transition hover:border-cyan-300/40 hover:text-white">
            {p}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div className="space-y-3.5">
          {adjustable.map((c) => {
            const pct = cuts[c.category] ?? 0;
            const cat = getCategory(c.category);
            return (
              <label key={c.category} className="block text-xs">
                <div className="mb-1.5 flex items-center gap-2">
                  <span>{cat.emoji}</span>
                  <span className="flex-1">{c.category}</span>
                  <span className="tabular-nums text-[var(--color-muted)]">{m(c.baseline)}</span>
                  <span className={`w-12 text-right tabular-nums font-semibold ${pct ? "text-cyan-300" : "text-[var(--color-muted)]"}`}>-{pct}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={pct}
                  aria-label={`Cut ${c.category}`}
                  onChange={(e) => setCuts((x) => ({ ...x, [c.category]: Number(e.target.value) }))}
                  className="w-full"
                />
              </label>
            );
          })}
        </div>
        <div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/5 p-4">
              <p className="text-xs text-[var(--color-muted)]">Monthly savings</p>
              <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-cyan-200" data-testid="whatif-monthly">
                <AnimatedNumber value={sim.monthlySavings} format={m} />
              </p>
            </div>
            <div className="rounded-2xl border border-violet-300/20 bg-violet-400/5 p-4">
              <p className="text-xs text-[var(--color-muted)]">Per year</p>
              <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-violet-200" data-testid="whatif-yearly">
                <AnimatedNumber value={sim.yearlySavings} format={m} />
              </p>
            </div>
          </div>
          <AnimatePresence>
            {sim.monthlySavings > 0 && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 text-xs text-[var(--color-muted)]"
              >
                Projected spend drops from {m(sim.baseline)} to <span className="text-white">{m(sim.projected)}</span>. In 12 months
                you&apos;d have <span className="text-cyan-200">{m(projection[11].scenario)}</span> saved instead of {m(projection[11].baseline)}.
              </motion.p>
            )}
          </AnimatePresence>
          <div className="mt-3">
            <SavingsChart data={projection} currency={currency} />
          </div>
        </div>
      </div>
    </Panel>
  );
}
