export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 grid-bg" />
      <div className="orb absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-cyan-500/25" />
      <div className="orb absolute top-1/3 -right-40 h-[32rem] w-[32rem] rounded-full bg-violet-600/25 [animation-delay:-5s]" />
      <div className="orb absolute -bottom-48 left-1/4 h-[26rem] w-[26rem] rounded-full bg-pink-500/15 [animation-delay:-10s]" />
    </div>
  );
}
