"use client";

import { motion, useSpring, useTransform } from "motion/react";
import { useEffect, type ReactNode } from "react";

export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
  delay = 0,
  testId,
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  delay?: number;
  testId?: string;
}) {
  return (
    <motion.section
      data-testid={testId}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
      className={`glass rounded-3xl p-5 sm:p-6 ${className}`}
    >
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">{title}</h2>}
            {subtitle && <p className="text-xs text-[var(--color-muted)]">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </motion.section>
  );
}

/** Springs from the previous value to the new one, formatting each frame. */
export function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const spring = useSpring(0, { stiffness: 70, damping: 20, mass: 0.8 });
  const text = useTransform(spring, (v) => format(v));
  useEffect(() => {
    spring.set(value);
  }, [spring, value]);
  return <motion.span className="tabular-nums">{text}</motion.span>;
}

export function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "cyan" | "violet" | "green" | "amber" }) {
  const tones = {
    muted: "bg-white/5 text-[var(--color-muted)] border-white/10",
    cyan: "bg-cyan-400/10 text-cyan-200 border-cyan-300/20",
    violet: "bg-violet-400/10 text-violet-200 border-violet-300/20",
    green: "bg-emerald-400/10 text-emerald-200 border-emerald-300/20",
    amber: "bg-amber-400/10 text-amber-200 border-amber-300/20",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}>{children}</span>;
}

export const btn =
  "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium transition hover:border-cyan-300/40 hover:bg-white/10 disabled:opacity-50 disabled:pointer-events-none";
export const btnPrimary =
  "inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500 px-4 py-2 text-sm font-medium text-white shadow-[0_0_30px_-8px_rgba(167,139,250,0.9)] transition hover:brightness-110 disabled:opacity-50";
export const field =
  "rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none transition focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-400/20 [&>option]:bg-slate-900";
export const input =
  "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50 focus:ring-2 focus:ring-cyan-400/20";
