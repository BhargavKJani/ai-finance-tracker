/**
 * Plans and prices for this app. The same billing module is shared by all of Bhargav's apps;
 * only this file changes between them.
 */

export const APP_ID = "moneytwin";
export const APP_NAME = "Moneytwin";
/** What one AI "use" is called in this app. */
export const USE_NAME = { one: "AI statement", many: "AI statements" };

export type PaidPlanId = "day" | "month";
export type PlanId = "free" | PaidPlanId;

export interface PaidPlan {
  id: PaidPlanId;
  name: string;
  /** Price in paise (₹1 = 100 paise), as Razorpay expects. */
  amount: number;
  /** How long the plan lasts once paid. */
  durationLabel: string;
  /** Most AI uses allowed while the plan is active. */
  limit: number;
}

export const FREE_LIMIT = 3;

export const PAID_PLANS: Record<PaidPlanId, PaidPlan> = {
  day: { id: "day", name: "Day pass", amount: 900, durationLabel: "24 hours", limit: 10 },
  month: { id: "month", name: "Monthly", amount: 4900, durationLabel: "30 days", limit: 60 },
};

/** Most AI calls one use may make. */
export const MAX_CALLS_PER_USE = 6;

/** Accent colours for the pricing page and checkout. */
export const THEME = { accent: "#22d3ee", accent2: "#8b5cf6" };

/** Copy for the pricing page. */
export const PRICING_COPY = {
  "chip": "Pay by UPI · no auto-renewal",
  "title": "Know your money for",
  "titleAccent": "less than a coffee",
  "sub": "Start free. When you want more, pay once with GPay, PhonePe, Paytm or any UPI app. Plans end on their own; nothing renews.",
  "free": "See where your money goes",
  "day": "Sort out one month in a day",
  "month": "Track every rupee, every week"
};

export const PLAN_FEATURES: Record<PlanId, string[]> = {
  free: [
    "3 statements analysed by Claude AI",
    "Unlimited imports with rule-based sorting",
    "Dashboard, trends and next-month forecast",
    "What-if simulator",
    "Transactions stay saved on your device",
  ],
  day: [
    "Up to 10 statements analysed by Claude in 24 hours",
    "Smart categories for every UPI, card and EMI line",
    "Personal AI money tips",
    "Everything in Free",
  ],
  month: [
    "Up to 60 statements analysed by Claude in 30 days",
    "Smart categories for every UPI, card and EMI line",
    "AI money tips that update as you add data",
    "Best for tracking every month",
  ],
};

export function isPaidPlan(v: unknown): v is PaidPlanId {
  return v === "day" || v === "month";
}

export const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

/** Billing is on only when every key it needs is set. Without them the app stays in free demo mode. */
export function billingEnabled(): boolean {
  return [
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.RAZORPAY_KEY_ID,
    process.env.RAZORPAY_KEY_SECRET,
  ].every((v) => Boolean(v?.trim()));
}
