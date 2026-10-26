import { Header } from "@/components/home/header";
import { HomeExperience } from "@/components/home/home-experience";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HomeExperience />
      </main>
      <footer className="site-footer wrap">
        <div>
          <a className="footer-brand" href="#">
            arcana.
          </a>
          <span>向内看见，向前生长。</span>
        </div>
        <p>塔罗是一种自我探索工具，不替代专业建议或个人判断。</p>
        <span className="footer-note">MADE FOR THE QUESTIONS THAT MATTER.</span>
      </footer>
    </>
  );
}
