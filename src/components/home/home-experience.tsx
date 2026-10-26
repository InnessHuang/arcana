"use client";

import { useRef, useState } from "react";
import { spreads, topics, type Spread } from "@/lib/home-content";
import { Arrow, TarotArt, TopicIcon } from "./artwork";
import { useRouter } from "next/navigation";
import { saveSession } from "@/lib/tarot/session";

export function HomeExperience() {
  const [question, setQuestion] = useState("");
  const [selected, setSelected] = useState<Spread>(spreads[1]);
  const [error, setError] = useState("");
  const router = useRouter();
  const starting = useRef(false);
  const [busy, setBusy] = useState(false);
  const [dailyRevealed, setDailyRevealed] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);

  function chooseQuestion(value: string) {
    setQuestion(value);
    setError("");
    document
      .getElementById("question")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
    input.current?.focus({ preventScroll: true });
  }
  function chooseSpread(spread: Spread) {
    setSelected(spread);
    document
      .getElementById("question")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
    input.current?.focus({ preventScroll: true });
  }
  function start() {
    if (question.trim().length < 4) {
      setError("请用至少 4 个字，写下你想探索的问题。");
      input.current?.focus();
      return;
    }
    if (starting.current) return;
    starting.current = true;
    setBusy(true);
    setError("");
    try {
      saveSession({ question: question.trim(), spread: selected, cards: [] });
      router.push("/reading");
    } catch {
      starting.current = false;
      setBusy(false);
      setError(
        "无法使用浏览器会话存储。请允许此站点存储后重试；问题尚未上传。",
      );
    }
  }

  return (
    <>
      <section className="hero wrap" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="small-rule" /> A LITTLE CLARITY, WITHIN.
          </p>
          <h1 id="hero-title">
            答案之外，
            <br />
            看见<span className="accent-text">更多可能。</span>
          </h1>
          <p className="hero-description">
            让塔罗成为一面镜子，而非一个定论。
            <br />
            从你在意的问题出发，梳理感受、理解当下，
            <br className="desktop-break" />
            为下一步找到自己的方向。
          </p>
          <form
            id="question"
            className="question-box"
            onSubmit={(e) => {
              e.preventDefault();
              start();
            }}
          >
            <label htmlFor="question-input">此刻，什么让你停下了脚步？</label>
            <textarea
              id="question-input"
              ref={input}
              value={question}
              maxLength={300}
              rows={3}
              placeholder="比如：想做出改变，却又害怕失去稳定，我该如何理解这份犹豫？"
              onChange={(e) => {
                setQuestion(e.target.value);
                setError("");
              }}
              aria-invalid={!!error}
              aria-describedby={error ? "question-error" : "question-help"}
            />
            {error && (
              <p className="input-error" id="question-error" role="alert">
                {error}
              </p>
            )}
            <div className="question-bottom">
              <span className="spread-label">
                {selected.count} 张牌 · {selected.name}
              </span>
              <button type="submit" className="solid-button" disabled={busy}>
                {busy ? "正在进入抽牌…" : "探索这个问题"} <Arrow />
              </button>
            </div>
          </form>
          <p className="question-help" id="question-help">
            本地模拟解读 · 仅当前标签页暂存，不上传 · {question.length}/300
          </p>
          <div className="question-examples">
            <span>还没有头绪？</span>
            <button onClick={() => chooseQuestion(topics[0].question)}>
              关于一段关系
            </button>
            <button onClick={() => chooseQuestion(topics[1].question)}>
              关于一个选择
            </button>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <p className="visual-topline">THE ART OF LOOKING INWARD</p>
          <TarotArt variant="moon" className="hero-card hero-card-back" />
          <TarotArt className="hero-card hero-card-front" />
          <span className="visual-spark">✧</span>
          <div className="visual-caption">
            <span>不是预知未来</span>
            <span>而是更清楚地走向它</span>
          </div>
          <span className="visual-index">FIG. 01 — A NEW PERSPECTIVE</span>
        </div>
      </section>

      <div className="philosophy">
        <div className="wrap philosophy-inner">
          <span>一种更温和的自我探索方式</span>
          <p>
            从真实处境出发 <i /> 让每一张牌有上下文 <i /> 把思考留给自己
          </p>
          <span className="philosophy-mark" aria-hidden="true">
            ✧
          </span>
        </div>
      </div>

      <section
        id="explore"
        className="section wrap"
        aria-labelledby="topics-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">01 / FIND YOUR STARTING POINT</p>
            <h2 id="topics-title">从你在意的事开始</h2>
          </div>
          <p>
            不必有一个完美的问题，
            <br />
            一个模糊的念头，也值得被认真对待。
          </p>
        </div>
        <div className="topic-grid">
          {topics.map((topic) => (
            <button
              className="topic-card"
              key={topic.name}
              onClick={() => chooseQuestion(topic.question)}
            >
              <TopicIcon kind={topic.icon} />
              <span className="topic-english">{topic.label}</span>
              <span className="topic-title">{topic.name}</span>
              <span className="topic-detail">{topic.detail}</span>
              <span className="topic-arrow">
                <Arrow diagonal />
              </span>
            </button>
          ))}
        </div>
      </section>

      <section
        id="spreads"
        className="section wrap spreads-section"
        aria-labelledby="spreads-title"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">02 / MAKE ROOM FOR PERSPECTIVE</p>
            <h2 id="spreads-title">给问题，一个合适的展开方式</h2>
          </div>
          <p>问题有深浅，探索也有不同的节奏。</p>
        </div>
        <div className="spread-grid">
          {spreads.map((spread, index) => (
            <article
              className={`spread-card ${selected.id === spread.id ? "is-selected" : ""}`}
              key={spread.id}
            >
              <div
                className={`spread-illustration spread-illustration-${index}`}
                aria-hidden="true"
              >
                {Array.from({ length: spread.count }, (_, i) => (
                  <div className="mini-card" key={i}>
                    <span>✧</span>
                  </div>
                ))}
                <span className="spread-card-number">0{index + 1}</span>
              </div>
              <div className="spread-body">
                <div className="spread-meta">
                  <span>{spread.count} 张牌</span>
                  <span>{spread.time}</span>
                  {index === 1 && (
                    <span className="recommendation">初次探索推荐</span>
                  )}
                </div>
                <h3>{spread.name}</h3>
                <p>{spread.description}</p>
                <button
                  aria-pressed={selected.id === spread.id}
                  className="spread-button"
                  onClick={() => chooseSpread(spread)}
                >
                  <span>
                    {selected.id === spread.id
                      ? "已选牌阵 · 去提问"
                      : "选择这个牌阵"}
                  </span>
                  <Arrow />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        id="daily"
        className="section wrap daily-section"
        aria-labelledby="daily-title"
      >
        <div className="daily-main">
          <div className="daily-copy">
            <p className="eyebrow">03 / A QUIET MOMENT</p>
            <h2 id="daily-title">
              留一点时间，
              <br />
              听听内心的声音。
            </h2>
            <p>
              不急着寻找答案。
              <br />
              用一张牌，为今天留一个思考的空隙。
            </p>
            <button
              className="text-button"
              onClick={() => setDailyRevealed(!dailyRevealed)}
              aria-expanded={dailyRevealed}
              aria-controls="daily-reflection"
            >
              {dailyRevealed ? "收起今日灵感" : "翻开今日灵感"}
              <Arrow />
            </button>
            <small>固定示例牌 · 每日抽牌体验预览</small>
          </div>
          <div className={`daily-art ${dailyRevealed ? "revealed" : ""}`}>
            <TarotArt variant={dailyRevealed ? "sun" : "back"} />
            <div id="daily-reflection" aria-live="polite">
              {dailyRevealed ? (
                <>
                  <span className="eyebrow">XIX · THE SUN</span>
                  <h3>太阳 · 看见已有的光</h3>
                  <p>今天，有什么微小的进展值得被你认可？</p>
                  <small>通用反思提示，不是预测或个性化解读。</small>
                </>
              ) : (
                <p className="daily-art-caption">
                  ONE CARD.
                  <br />A DIFFERENT WAY TO SEE.
                </p>
              )}
            </div>
          </div>
        </div>
        <aside className="editorial">
          <p className="eyebrow">THE ARCANA PERSPECTIVE</p>
          <span className="quote-mark" aria-hidden="true">
            “
          </span>
          <h3>
            好的问题，
            <br />
            比确定的答案
            <br />
            更有力量。
          </h3>
          <p>
            塔罗不替你做决定。它提供一种观看的方式，让藏在日常之下的感受与可能，有机会浮现。
          </p>
          <a href="#question" className="text-button">
            从一个问题开始 <Arrow diagonal />
          </a>
          <span className="editorial-index">NOTES ON SELF-DISCOVERY — 001</span>
        </aside>
      </section>
    </>
  );
}
