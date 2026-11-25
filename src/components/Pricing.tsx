"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { useAccount } from "./AccountProvider";
import { BillingPricing } from "./BillingPricing";

const PLANS = [
  {
    id: "free",
    name: "Free",
    tagline: "Everything you need to see where your money goes.",
    monthly: 0,
    yearly: 0,
    cta: "Start free",
    href: "/dashboard",
    features: [
      "Unlimited CSV statement imports",
      "Rule-based auto-categorisation",
      "Animated dashboard & trends",
      "Next-month forecast",
      "What-if simulator (3 scenarios)",
      "5 AI insight refreshes / month",
      "100% local, no account needed",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Your full financial digital twin, powered by Claude.",
    monthly: 7,
    yearly: 59,
    cta: "Go Premium",
    href: "/dashboard?plan=premium",
    highlight: true,
    features: [
      "Everything in Free",
      "Unlimited AI categorisation & insights",
      "Unlimited what-if scenarios & goals",
      "12-month forecasts with confidence bands",
      "Multi-account & multi-currency",
      "End-to-end encrypted sync (opt-in)",
      "PDF monthly reports & priority support",
    ],
  },
];

export function Pricing() {
  const [yearly, setYearly] = useState(true);
  const { billing } = useAccount();
  // Real UPI plans when Razorpay + Supabase are configured; otherwise the original preview plans.
  if (billing) return <BillingPricing compact />;
  return (
    <div>
      <div className="mb-10 flex justify-center">
        <div className="glass inline-flex rounded-full p-1 text-sm" role="tablist" aria-label="Billing period">
          {(["Monthly", "Yearly"] as const).map((label) => {
            const active = (label === "Yearly") === yearly;
            return (
              <button
                key={label}
                role="tab"
                aria-selected={active}
                onClick={() => setYearly(label === "Yearly")}
                className={`relative rounded-full px-5 py-2 transition ${active ? "text-slate-950" : "text-[var(--color-muted)] hover:text-white"}`}
              >
                {active && (
                  <motion.span layoutId="billing-pill" className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", bounce: 0.25, duration: 0.5 }} />
                )}
                <span className="relative">
                  {label}
                  {label === "Yearly" && <span className="ml-1.5 text-xs font-semibold text-emerald-500">-30%</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        {PLANS.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            className={`glass glass-hover relative flex flex-col rounded-3xl p-8 ${p.highlight ? "neon-ring" : ""}`}
            data-testid={`plan-${p.id}`}
          >
            {p.highlight && (
              <span className="absolute -top-3 left-8 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-3 py-1 text-xs font-semibold text-slate-950">
                <Sparkles className="h-3 w-3" /> Most popular
              </span>
            )}
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold">{p.name}</h3>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{p.tagline}</p>
            <div className="mt-6 flex items-end gap-1">
              <span className="font-[family-name:var(--font-display)] text-5xl font-bold">
                ${yearly ? (p.yearly / 12).toFixed(p.yearly ? 2 : 0) : p.monthly}
              </span>
              <span className="mb-1.5 text-sm text-[var(--color-muted)]">/ month</span>
            </div>
            <p className="h-5 text-xs text-[var(--color-muted)]">{p.monthly ? (yearly ? `Billed $${p.yearly} yearly` : "Billed monthly, cancel anytime") : "Free forever"}</p>
            <ul className="mt-6 flex-1 space-y-3 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex gap-3">
                  <Check className={`mt-0.5 h-4 w-4 shrink-0 ${p.highlight ? "text-cyan-300" : "text-emerald-400"}`} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href={p.href}
              className={`mt-8 rounded-xl px-5 py-3 text-center font-medium transition ${
                p.highlight
                  ? "bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500 text-white shadow-[0_0_40px_-8px_rgba(167,139,250,0.9)] hover:brightness-110"
                  : "border border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              {p.cta}
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
