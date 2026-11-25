import Link from "next/link";
import { Logo } from "./Logo";
import { AccountButton } from "./AccountButton";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#05060f]/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-1 text-sm text-[var(--color-muted)] sm:gap-2">
          <Link href="/#features" className="hidden rounded-lg px-3 py-2 hover:text-white sm:block">
            Features
          </Link>
          <Link href="/pricing" className="rounded-lg px-3 py-2 hover:text-white">
            Pricing
          </Link>
          <AccountButton />
          <Link
            href="/dashboard"
            className="rounded-xl bg-white px-4 py-2 font-medium text-slate-950 shadow-[0_0_30px_-6px_rgba(34,211,238,0.7)] transition hover:bg-cyan-200"
          >
            Open app
          </Link>
        </nav>
      </div>
    </header>
  );
}
