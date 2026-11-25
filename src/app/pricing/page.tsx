import type { Metadata } from "next";
import { Background } from "@/components/Background";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { Pricing } from "@/components/Pricing";

export const metadata: Metadata = { title: "Pricing · Moneytwin" };

const FAQ = [
  ["Where is my data stored?", "In your browser's IndexedDB. Statements are parsed locally; nothing is uploaded unless you use AI features, which only receive merchant names or aggregated totals."],
  ["Does it work without an API key?", "Yes. Without an Anthropic key the app runs in demo mode with built-in heuristics for categorisation and insights."],
  ["Do paid plans renew automatically?", "No. You pay once by UPI and the plan ends on its own. You keep your local data either way."],
  ["Is this financial advice?", "No. Moneytwin gives educational, data-driven observations, not personalised investment advice."],
];

export default function PricingPage() {
  return (
    <>
      <Background />
      <Nav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-20 sm:px-6">
        <h1 className="text-center font-[family-name:var(--font-display)] text-5xl font-bold">
          Start free. <span className="text-gradient">Upgrade when you&apos;re ready.</span>
        </h1>
        <p className="mx-auto mt-4 mb-12 max-w-xl text-center text-[var(--color-muted)]">
          Track for free forever. Pay by UPI only when you want Claude to sort and coach your money.
        </p>
        <Pricing />
        <div className="mx-auto mt-20 grid max-w-4xl gap-4 sm:grid-cols-2">
          {FAQ.map(([q, a]) => (
            <div key={q} className="glass rounded-2xl p-6">
              <h3 className="font-semibold">{q}</h3>
              <p className="mt-2 text-sm text-[var(--color-muted)]">{a}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
