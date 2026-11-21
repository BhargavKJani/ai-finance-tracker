export interface CategoryDef {
  name: string;
  color: string;
  emoji: string;
  keywords: string[];
  /** Income categories are matched only for positive amounts. */
  income?: boolean;
}

export const CATEGORIES: CategoryDef[] = [
  {
    name: "Income",
    color: "#34d399",
    emoji: "💼",
    income: true,
    keywords: ["salary", "payroll", "paycheck", "direct dep", "dividend", "interest paid", "refund", "freelance", "invoice", "bonus"],
  },
  {
    name: "Housing",
    color: "#a78bfa",
    emoji: "🏠",
    keywords: ["rent", "mortgage", "landlord", "property mgmt", "hoa", "apartments"],
  },
  {
    name: "Utilities",
    color: "#60a5fa",
    emoji: "💡",
    keywords: ["electric", "power co", "water", "gas co", "internet", "comcast", "xfinity", "verizon", "at&t", "t-mobile", "energy", "utility"],
  },
  {
    name: "Groceries",
    color: "#4ade80",
    emoji: "🛒",
    keywords: ["grocery", "whole foods", "trader joe", "safeway", "kroger", "aldi", "costco", "walmart groc", "lidl", "tesco", "market"],
  },
  {
    name: "Food Delivery",
    color: "#fb923c",
    emoji: "🛵",
    keywords: ["uber eats", "ubereats", "doordash", "grubhub", "deliveroo", "postmates", "swiggy", "zomato", "just eat", "instacart"],
  },
  {
    name: "Dining",
    color: "#f472b6",
    emoji: "🍽️",
    keywords: ["restaurant", "cafe", "coffee", "starbucks", "mcdonald", "chipotle", "pizza", "sushi", "bistro", "grill", "bar &", "taco", "burger"],
  },
  {
    name: "Transport",
    color: "#22d3ee",
    emoji: "🚗",
    keywords: ["uber trip", "uber *trip", "lyft", "shell", "chevron", "exxon", "bp ", "fuel", "parking", "metro", "transit", "toll", "train"],
  },
  {
    name: "Shopping",
    color: "#facc15",
    emoji: "🛍️",
    keywords: ["amazon", "amzn", "target", "ikea", "best buy", "zara", "h&m", "nike", "etsy", "ebay", "apple store", "uniqlo"],
  },
  {
    name: "Subscriptions",
    color: "#c084fc",
    emoji: "🔁",
    keywords: ["netflix", "spotify", "disney", "hulu", "youtube premium", "icloud", "apple.com/bill", "google storage", "adobe", "chatgpt", "claude.ai", "notion", "dropbox", "prime video", "hbo"],
  },
  {
    name: "Entertainment",
    color: "#f87171",
    emoji: "🎬",
    keywords: ["cinema", "amc ", "theatre", "ticketmaster", "steam", "playstation", "xbox", "concert", "bowling"],
  },
  {
    name: "Health",
    color: "#2dd4bf",
    emoji: "🩺",
    keywords: ["pharmacy", "cvs", "walgreens", "gym", "fitness", "dental", "clinic", "doctor", "hospital", "health"],
  },
  {
    name: "Travel",
    color: "#818cf8",
    emoji: "✈️",
    keywords: ["airline", "airbnb", "hotel", "booking.com", "expedia", "delta", "united air", "ryanair", "marriott", "hilton"],
  },
  {
    name: "Transfers",
    color: "#94a3b8",
    emoji: "🔄",
    keywords: ["transfer", "zelle", "venmo", "paypal transfer", "savings acct", "credit card payment", "autopay"],
  },
  { name: "Other", color: "#64748b", emoji: "🧩", keywords: [] },
];

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);
export const EXPENSE_CATEGORY_NAMES = CATEGORIES.filter((c) => !c.income).map((c) => c.name);

const byName = new Map(CATEGORIES.map((c) => [c.name.toLowerCase(), c]));

export function getCategory(name: string): CategoryDef {
  return byName.get(name.toLowerCase()) ?? byName.get("other")!;
}

export function isKnownCategory(name: string): boolean {
  return byName.has(name.toLowerCase());
}

/** Normalises a free-form category name (e.g. from an AI response) to a known category. */
export function normaliseCategory(name: string | undefined | null): string {
  if (!name) return "Other";
  const hit = byName.get(name.trim().toLowerCase());
  return hit ? hit.name : "Other";
}

/**
 * Rule-based categorisation. Returns null when no rule matches, so the caller
 * can fall back to AI for the unknowns.
 */
export function categorizeByRules(description: string, amount: number): string | null {
  const text = ` ${description.toLowerCase()} `;
  for (const cat of CATEGORIES) {
    if (cat.income && amount <= 0) continue;
    if (!cat.income && amount > 0 && cat.name !== "Transfers") continue;
    if (cat.keywords.some((k) => text.includes(k))) return cat.name;
  }
  if (amount > 0) return "Income";
  return null;
}
