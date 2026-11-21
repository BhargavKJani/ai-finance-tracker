import Link from "next/link";
import { BrainCircuit, FileUp, LineChart, Lock, SlidersHorizontal, Sparkles, Tags, Zap } from "lucide-react";
import { Background } from "@/components/Background";
import { HeroPreview } from "@/components/HeroPreview";
import { Nav } from "@/components/Nav";
import { Pricing } from "@/components/Pricing";
import { Footer } from "@/components/Footer";

const FEATURES = [
  { icon: FileUp, title: "Drop in any bank CSV", body: "Smart column and date detection handles Amount or Debit/Credit layouts, US and EU dates. Duplicates are skipped automatically." },
  { icon: Tags, title: "Rules first, AI second", body: "Fast keyword rules categorise most rows instantly. Only unknown merchants go to Claude, so it stays cheap and private." },
  { icon: LineChart, title: "Animated dashboard", body: "Monthly income vs. spend, category breakdowns and trend lines that update the moment you import or edit." },
  { icon: Zap, title: "Next-month forecast", body: "A recency-weighted, trend-aware model per category predicts next month's spending before it happens." },
  { icon: SlidersHorizontal, title: "What-if simulator", body: "Type \"cut food delivery 30%\" or drag the sliders and watch your projected yearly savings grow." },
  { icon: BrainCircuit, title: "AI insight cards", body: "Claude reads an aggregated snapshot (never raw rows) and turns it into specific, actionable coaching." },
];

export default function Home() {
  return (
    <>
      <Background />
      <Nav />
      <main className="flex-1">
        <section className="mx-auto grid max-w-7xl items-center gap-14 px-4 pt-16 pb-24 sm:px-6 lg:grid-cols-2 lg:pt-24">
          <div>
            <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" /> AI finance tracker · powered by Claude
            </span>
            <h1 className="mt-6 font-[family-name:var(--font-display)] text-5xl leading-[1.05] font-bold tracking-tight sm:text-6xl">
              The <span className="text-gradient">digital twin</span> of your money.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-[var(--color-muted)]">
              Upload a bank statement and Moneytwin auto-categorises every transaction, forecasts next month and lets you
              simulate decisions before you make them. All in your browser, with nothing uploaded to a server you don&apos;t control.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard?sample=1"
                className="rounded-xl bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500 px-6 py-3 font-medium text-white shadow-[0_0_40px_-8px_rgba(167,139,250,0.9)] transition hover:brightness-110"
              >
                Try the live demo
              </Link>
              <Link href="/pricing" className="glass rounded-xl px-6 py-3 font-medium transition hover:bg-white/10">
                See pricing
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-2 text-sm text-[var(--color-muted)]">
              <Lock className="h-4 w-4 text-emerald-400" /> Stored locally in IndexedDB. No sign-up. Works offline.
            </div>
          </div>
          <HeroPreview />
        </section>

        <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-24 sm:px-6">
          <h2 className="text-center font-[family-name:var(--font-display)] text-4xl font-bold">Everything your bank app should do</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-[var(--color-muted)]">From messy CSV to clear decisions in under ten seconds.</p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass glass-hover rounded-2xl p-6">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 text-cyan-300">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
          <div className="glass grid gap-8 rounded-3xl p-8 sm:grid-cols-3 sm:p-10">
            {[
              ["1", "Import", "Upload CSVs, add rows by hand, or load the sample statements."],
              ["2", "Understand", "Rules + AI categorise; the dashboard shows where it all goes."],
              ["3", "Simulate", "Forecast next month and test what-if cuts before you commit."],
            ].map(([n, t, b]) => (
              <div key={n}>
                <span className="font-[family-name:var(--font-display)] text-5xl font-bold text-gradient">{n}</span>
                <h3 className="mt-2 text-lg font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{b}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-28 sm:px-6">
          <h2 className="text-center font-[family-name:var(--font-display)] text-4xl font-bold">Simple pricing</h2>
          <p className="mx-auto mt-3 mb-10 max-w-xl text-center text-[var(--color-muted)]">Start free. Upgrade when your twin needs superpowers.</p>
          <Pricing />
        </section>
      </main>
      <Footer />
    </>
  );
}
