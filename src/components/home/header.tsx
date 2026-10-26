import Link from "next/link";

export function Header() {
  return (
    <header className="site-header wrap">
      <Link href="/" className="brand" aria-label="Arcana 首页">
        <span className="brand-symbol" aria-hidden="true">
          a
        </span>
        arcana<span className="brand-dot">.</span>
      </Link>
      <nav aria-label="主导航">
        <a href="#explore">主题探索</a>
        <a href="#spreads">找到你的牌阵</a>
        <a href="#daily">每日灵感</a>
      </nav>
      <a className="header-cta" href="#question">
        开启一次探索 <span aria-hidden="true">↗</span>
      </a>
    </header>
  );
}
