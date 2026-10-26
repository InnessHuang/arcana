import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_80%_20%,#253b2b_0%,transparent_55%)]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 sm:px-10">
        <Link href="/" aria-label="Arcana 首页" className="text-xl font-semibold tracking-tight">
          <span aria-hidden="true" className="mr-3 text-[#c9deac]">✳</span>Arcana
        </Link>
        <span className="text-xs tracking-[0.2em] text-[#a6b3a7]">一个想法，无限可能</span>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-24 sm:px-10 sm:pt-36">
        <p className="mb-8 text-xs tracking-[0.3em] text-[#c9deac]">为好奇心留一处空间</p>
        <h1 className="font-serif text-7xl leading-none tracking-tight sm:text-9xl">Arcana</h1>
        <h2 className="mt-10 text-3xl leading-snug font-medium tracking-tight sm:text-5xl">
          收集灵感，<br className="sm:hidden" />连接新的可能。
        </h2>
        <p className="mt-7 max-w-lg text-base leading-8 text-[#b3bdb3] sm:text-lg">
          一个整理想法、连接知识与探索灵感的空间。<br className="hidden sm:block" />
          让零散的思考，逐渐成为清晰的方向。
        </p>
        <div className="mt-20 grid gap-8 border-t border-white/15 pt-8 sm:grid-cols-3">
          {[
            ["01", "记录", "给每一个转瞬即逝的想法，一个落脚点。"],
            ["02", "连接", "在不同的知识之间，发现新的线索。"],
            ["03", "探索", "保持好奇，让灵感慢慢生长。"],
          ].map(([number, title, description]) => (
            <section key={number}>
              <p className="text-xs text-[#8eaa8b]">{number}</p>
              <h3 className="mt-4 text-lg">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#a6b3a7]">{description}</p>
            </section>
          ))}
        </div>
      </main>
      <footer className="mx-auto max-w-6xl px-6 pb-8 text-xs text-[#a6b3a7] sm:px-10">
        ARCANA · 灵感，从这里开始。
      </footer>
    </div>
  );
}
