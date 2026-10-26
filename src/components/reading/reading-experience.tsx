"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { TarotArt } from "@/components/home/artwork";
import { drawCards } from "@/lib/tarot/draw";
import { describeCard, summarize } from "@/lib/tarot/reading";
import {
  readSession,
  saveSession,
  type ReadingSession,
} from "@/lib/tarot/session";

export function ReadingExperience() {
  const [session, setSession] = useState<ReadingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"deep" | "real" | null>(null);
  const lock = useRef(false);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const explorationHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        setSession(readSession());
      } catch {
        setError(
          "无法恢复这次探索：会话数据可能已损坏，或浏览器存储不可用。请返回首页重新开始。",
        );
      } finally {
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (session?.cards.length) resultHeading.current?.focus();
  }, [session]);
  useEffect(() => {
    if (mode) explorationHeading.current?.focus();
  }, [mode]);

  async function draw() {
    if (!session || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      // Yield one frame so the disabled/loading state is painted before selecting cards.
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      const next = { ...session, cards: drawCards(session.spread.positions) };
      saveSession(next);
      setMode(null);
      setSession(next);
    } catch {
      setError(
        "抽牌未完成。请检查浏览器是否允许会话存储，然后重试；原有结果没有被替换。",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function restart() {
    if (!session || lock.current) return;
    try {
      const next = { ...session, cards: [] };
      saveSession(next);
      setSession(next);
      setMode(null);
      setError("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("无法重新开始，请检查浏览器存储权限；当前结果仍保留。");
    }
  }
  if (loading)
    return (
      <section className="reading-empty" role="status">
        <p className="eyebrow">ARCANA / EXPLORATION</p>
        <h1>正在恢复你的探索…</h1>
      </section>
    );
  if (!session)
    return (
      <section className="reading-empty">
        <p className="eyebrow">ARCANA / A FRESH START</p>
        <h1>从一个问题，重新开始。</h1>
        <p role={error ? "alert" : undefined}>
          {error ||
            "这里还没有可用的问题或抽牌结果。请先在首页输入问题并选择牌阵。"}
        </p>
        <Link href="/" className="solid-button">
          返回首页
        </Link>
      </section>
    );

  const hasResult = session.cards.length > 0;
  return (
    <div className="reading-wrap">
      <div className="reading-topbar">
        <Link href="/">← 返回首页</Link>
        <span className="eyebrow">
          {hasResult ? "02 / REFLECT" : "01 / DRAW YOUR CARDS"}
        </span>
      </div>
      <header className="reading-intro">
        <p className="eyebrow">
          {session.spread.name} · {session.spread.count} 张牌
        </p>
        <h1>
          {hasResult
            ? "看见牌面，也看见自己。"
            : "带着问题，留一个安静的片刻。"}
        </h1>
        <blockquote>{session.question}</blockquote>
        <p className="reading-demo-label">
          本地模拟解读 · 规则模板演示 · 非 AI 生成
        </p>
      </header>
      {error && (
        <p className="reading-error" role="alert">
          {error}
        </p>
      )}
      {!hasResult ? (
        <section className="draw-stage" aria-label="抽牌步骤">
          <p className="muted">
            这次将从 78 张牌中随机、不重复地抽取 {session.spread.count}{" "}
            张，并分别随机决定正逆位。
          </p>
          <div className="draw-card-grid">
            {session.spread.positions.map((position, index) => (
              <div className="draw-slot" key={position}>
                <TarotArt variant="back" />
                <span className="eyebrow">0{index + 1}</span>
                <h2>{position}</h2>
              </div>
            ))}
          </div>
          <button className="solid-button" disabled={busy} onClick={draw}>
            {busy ? "正在抽取牌面…" : "抽取牌面"}
          </button>
          <p className="muted" role="status">
            {busy
              ? "正在整理这次的观察角度，请稍候。"
              : "牌面提供反思视角，不替你决定未来。"}
          </p>
        </section>
      ) : (
        <>
          <section className="reading-results" aria-labelledby="results-title">
            <div className="reading-section-title">
              <h2 ref={resultHeading} tabIndex={-1} id="results-title">
                这一次，你的牌面
              </h2>
              <button className="text-button" onClick={restart} disabled={busy}>
                重新抽牌 ↗
              </button>
            </div>
            <div
              className={`result-grid ${session.cards.length === 1 ? "single-result" : ""}`}
            >
              {session.cards.map((item, index) => (
                <article
                  className="result-card"
                  key={item.card.id}
                  data-card-id={item.card.id}
                  data-orientation={item.orientation}
                >
                  <p className="eyebrow">
                    0{index + 1} / {item.position}
                  </p>
                  <div
                    className={`drawn-face ${item.orientation === "reversed" ? "is-reversed" : ""}`}
                  >
                    <span className="card-ornament" aria-hidden="true">
                      ◇
                    </span>
                    <span className="card-family">
                      {item.card.arcana === "major"
                        ? "大阿尔卡那"
                        : "小阿尔卡那"}
                    </span>
                    <h3>{item.card.name}</h3>
                    <span className="card-id">
                      {item.card.id.toUpperCase()}
                    </span>
                  </div>
                  <div className="result-name">
                    <h3>{item.card.name}</h3>
                    <span>
                      {item.orientation === "upright" ? "正位" : "逆位"}
                    </span>
                  </div>
                  <p className="card-keywords">
                    {item.card.keywords.join(" · ")}
                  </p>
                  <p className="card-meaning">
                    {describeCard(session.question, item)}
                  </p>
                </article>
              ))}
            </div>
          </section>
          <section className="reading-summary">
            <p className="eyebrow">A THREAD TO FOLLOW / 整体摘要</p>
            <h2>把这些线索，放回你的生活。</h2>
            <p>{summarize(session.question, session.spread, session.cards)}</p>
          </section>
          <section className="exploration-options" aria-label="继续探索">
            <button
              className={mode === "deep" ? "active" : ""}
              onClick={() => setMode("deep")}
              aria-expanded={mode === "deep"}
              aria-controls="exploration-detail"
            >
              <span className="eyebrow">LOOK WITHIN</span>
              <strong>
                深入探索 <span aria-hidden="true">↗</span>
              </strong>
              <span>连接牌义，回到你的感受与期待。</span>
            </button>
            <button
              className={mode === "real" ? "active" : ""}
              onClick={() => setMode("real")}
              aria-expanded={mode === "real"}
              aria-controls="exploration-detail"
            >
              <span className="eyebrow">STEP INTO LIFE</span>
              <strong>
                现实探索 <span aria-hidden="true">↗</span>
              </strong>
              <span>区分事实与假设，找到可验证的小行动。</span>
            </button>
          </section>
          <section
            id="exploration-detail"
            className={mode ? "exploration-detail" : ""}
            aria-live="polite"
          >
            {mode && (
              <>
                <p className="eyebrow">
                  {mode === "deep"
                    ? "DEEP EXPLORATION"
                    : "REAL-WORLD EXPLORATION"}{" "}
                  · 本地反思模板
                </p>
                <h2 tabIndex={-1} ref={explorationHeading}>
                  {mode === "deep"
                    ? "循着牌义，往内多走一步。"
                    : "带着问题，回到现实之中。"}
                </h2>
                <p className="exploration-context">
                  仍在探索：{session.question}
                </p>
                <p className="muted">
                  {session.spread.name} ·{" "}
                  {session.cards
                    .map(
                      (item) =>
                        `${item.position}：${item.card.name}${item.orientation === "upright" ? "正位" : "逆位"}`,
                    )
                    .join(" / ")}
                </p>
                {mode === "deep" ? (
                  <ol>
                    {session.cards.map((item) => (
                      <li key={item.card.id}>
                        <strong>
                          {item.position} · {item.card.name}
                        </strong>
                        <p>
                          当你想到「{item.card.keywords.join("、")}
                          」时，最先浮现的是哪段真实经历？「
                          {item.card[item.orientation]}
                          」与你的感受吻合吗，又有哪些不吻合？
                        </p>
                      </li>
                    ))}
                    <li>
                      <strong>看看线索之间的联系</strong>
                      <p>
                        {session.cards.length > 1
                          ? `「${session.cards[0].card.name}」与「${session.cards[1].card.name}」的关键词是否指向不同需要？你想优先照顾哪一个，为什么？`
                          : "这张牌提供的视角之外，还有哪些被忽略的感受或解释？"}
                      </p>
                    </li>
                  </ol>
                ) : (
                  <ol>
                    <li>
                      <strong>先梳理事实</strong>
                      <p>
                        对于「{session.question}
                        」，列出三个已知事实与三个尚未证实的假设。你需要向谁了解更多信息？
                      </p>
                    </li>
                    <li>
                      <strong>一个可验证的小行动</strong>
                      <p>
                        把「
                        {session.cards[
                          session.cards.length - 1
                        ].card.keywords.join("、")}
                        」当作提示，而非指令：写下两种可选行动，再选一个低成本、可撤回的尝试，并约定回顾时间。
                      </p>
                    </li>
                    <li>
                      <strong>确认风险与边界</strong>
                      <p>
                        最坏的代价是什么？是否涉及健康、金钱或人身安全？哪些条件下应该暂停，并向合适的专业人士求助？
                      </p>
                    </li>
                  </ol>
                )}
                <p className="muted">
                  以上问题由固定规则组合，不是对你处境的事实判断，也未生成新的牌面。
                </p>
              </>
            )}
          </section>
          <div className="reading-actions">
            <Link href="/" className="solid-button">
              回到首页，探索新的问题
            </Link>
            <button className="text-button" onClick={restart}>
              保留问题，重新抽牌
            </button>
          </div>
        </>
      )}
      <footer className="reading-disclaimer">
        塔罗内容仅用于自我反思和娱乐，不代表对未来的确定预测，也不替代医疗、心理、法律或财务等专业建议。本页解读和探索提示均为本地模板演示，未接入真实大模型；问题与结果仅暂存在当前浏览器标签页，不上传、不进入数据库。
      </footer>
    </div>
  );
}
