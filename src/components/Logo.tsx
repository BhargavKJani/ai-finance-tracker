import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
      <span className="relative grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 via-violet-500 to-pink-500 shadow-[0_0_24px_-4px_rgba(167,139,250,0.8)]">
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M4 16l4-5 4 3 6-8" />
          <path d="M15 6h3v3" />
        </svg>
      </span>
      <span>
        Money<span className="text-gradient">twin</span>
      </span>
    </Link>
  );
}
