export const CURRENCIES = ["USD", "EUR", "GBP", "INR", "CAD", "AUD"] as const;

export function formatMoney(n: number, currency = "USD", opts: { decimals?: boolean; compact?: boolean } = {}): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: opts.compact ? "compact" : "standard",
    minimumFractionDigits: opts.decimals ? 2 : 0,
    maximumFractionDigits: opts.decimals ? 2 : opts.compact ? 1 : 0,
  }).format(n);
}

export const formatPct = (n: number) => `${n >= 0 ? "" : "-"}${Math.abs(Math.round(n * 100))}%`;
