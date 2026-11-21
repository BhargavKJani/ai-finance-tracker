"use client";

import { motion } from "motion/react";

const BARS = [62, 74, 58, 81, 69, 88];
const CATS = [
  { name: "Housing", pct: 44, color: "#a78bfa" },
  { name: "Food Delivery", pct: 14, color: "#fb923c" },
  { name: "Groceries", pct: 12, color: "#4ade80" },
  { name: "Dining", pct: 9, color: "#f472b6" },
];

/** Decorative animated mini-dashboard for the landing hero. */
export function HeroPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 12 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
      className="glass relative mx-auto w-full max-w-xl rounded-3xl p-5 [perspective:1200px]"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">Forecast · Nov</p>
          <p className="font-[family-name:var(--font-display)] text-3xl font-bold">$4,712</p>
        </div>
        <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-300">-$312 with what-if</span>
      </div>
      <div className="flex h-36 items-end gap-3">
        {BARS.map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ delay: 0.4 + i * 0.08, duration: 0.8, ease: "easeOut" }}
            className={`flex-1 rounded-t-lg ${
              i === BARS.length - 1
                ? "border border-dashed border-cyan-300/70 bg-cyan-400/10"
                : "bg-gradient-to-t from-violet-600/60 to-cyan-400/80"
            }`}
          />
        ))}
      </div>
      <div className="mt-5 space-y-2.5">
        {CATS.map((c, i) => (
          <div key={c.name} className="flex items-center gap-3 text-xs">
            <span className="w-24 text-[var(--color-muted)]">{c.name}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${c.pct * 2}%` }}
                transition={{ delay: 0.9 + i * 0.1, duration: 0.8 }}
                className="h-full rounded-full"
                style={{ background: c.color, boxShadow: `0 0 12px ${c.color}` }}
              />
            </div>
            <span className="w-8 text-right tabular-nums">{c.pct}%</span>
          </div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="glass absolute -right-4 -bottom-10 !bg-slate-950/85 hidden max-w-[15rem] rounded-2xl p-3 text-xs sm:block"
      >
        <p className="font-semibold text-amber-300">⚡ Food Delivery is climbing</p>
        <p className="mt-1 text-[var(--color-muted)]">Up $96 vs last month. A 30% cut saves ~$1.1k a year.</p>
      </motion.div>
    </motion.div>
  );
}
