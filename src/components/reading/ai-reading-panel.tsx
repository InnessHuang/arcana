"use client";

import { useEffect, useRef, useState } from "react";
import {
  makeReadingRequest,
  parseAIReading,
  styleLabels,
  type AIReading,
  type ReadingRequest,
} from "@/lib/ai/contracts";
import type { ReadingSession } from "@/lib/tarot/session";

export function AIReadingPanel({ session }: { session: ReadingSession }) {
  const [style, setStyle] = useState<ReadingRequest["style"]>("auto");
  const [background, setBackground] = useState("");
  const [reading, setReading] = useState<AIReading | null>(null);
  const [busy, setBusy] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const result = useRef<HTMLHeadingElement>(null);
  useEffect(
    () => () => {
      controller.current?.abort();
      controller.current = null;
    },
    [],
  );
  useEffect(() => {
    if (reading) result.current?.focus();
  }, [reading]);

  async function generate(nextStyle = style) {
    if (controller.current) return;
    const current = new AbortController();
    controller.current = current;
    const timeout = setTimeout(() => current.abort(), 55000);
    setBusy(true);
    setAttempted(true);
    setError("");
    setReading(null);
    const input = makeReadingRequest(session, nextStyle, background.trim());
    try {
      const response = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: current.signal,
        cache: "no-store",
      });
      const data = await response.json();
      if (controller.current !== current) return;
      if (!response.ok) {
        const messages: Record<string, string> = {
          NOT_CONFIGURED:
            "AI 解读尚未配置。请在服务端设置 DEEPSEEK_API_KEY 后重启服务。",
          CONFIG_ERROR: "AI 服务配置有误，请检查服务端配置。",
          RATE_LIMITED: "请求较频繁或服务额度暂不可用，请稍后重试。",
          TIMEOUT: "AI 解读超时，请稍后重试。",
          PROVIDER_AUTH: "AI 服务认证或余额不可用，请检查服务端凭据与账户。",
          INVALID_OUTPUT: "AI 返回的解读格式或牌面信息不符合要求，请重试。",
          INVALID_INPUT: "问题或牌面数据无效，请返回首页重新开始。",
          TOO_LARGE: "输入内容过长，请缩短背景后重试。",
        };
        setError(
          messages[data?.error?.code] || "AI 服务暂时不可用，请稍后重试。",
        );
        return;
      }
      setReading(parseAIReading(data.reading, input));
    } catch {
      if (controller.current === current)
        setError(
          current.signal.aborted
            ? "请求等待超时，请稍后重试。"
            : "网络连接失败或解读格式异常，请重试。",
        );
    } finally {
      clearTimeout(timeout);
      if (controller.current === current) {
        controller.current = null;
        setBusy(false);
      }
    }
  }
  function switchStyle(value: ReadingRequest["style"]) {
    if (controller.current) return;
    setStyle(value);
    setReading(null);
    setError("");
    if (attempted) void generate(value);
  }
  return (
    <section
      className="ai-reading-panel"
      aria-labelledby="ai-title"
      aria-busy={busy}
    >
      <div className="ai-panel-heading">
        <div>
          <p className="eyebrow">AI INTERPRETATION / DEEPSEEK</p>
          <h2 id="ai-title">让牌面，回应你的问题。</h2>
        </div>
        <span className="ai-source-label">
          {reading ? "AI 生成 · 象征性解读" : "真实模型接口 · 尚未生成"}
        </span>
      </div>
      <div className="ai-controls">
        <label htmlFor="reading-style">解读风格</label>
        <select
          id="reading-style"
          value={style}
          disabled={busy}
          onChange={(e) =>
            switchStyle(e.target.value as ReadingRequest["style"])
          }
        >
          <option value="auto">由 AI 推荐</option>
          {Object.entries(styleLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <p className="muted">
          传统塔罗重视象征，理性分析区分事实与推测，混合风格兼顾两者。切换只重新解读，保留问题与牌面。
        </p>
        <label htmlFor="reading-background">
          补充背景 <span className="muted">（可选，最多 1000 字）</span>
        </label>
        <textarea
          id="reading-background"
          rows={3}
          maxLength={1000}
          value={background}
          disabled={busy}
          placeholder="只填写你愿意分享的已知情况，无需填写姓名或联系方式。"
          onChange={(e) => {
            setBackground(e.target.value);
            setReading(null);
            setError("");
          }}
        />
        <p className="ai-privacy-note">
          点击生成或切换风格后，问题、牌面及本次背景将经本站服务端发送给
          DeepSeek。不会发送密钥到浏览器；本站不写入数据库。AI
          解读不持久保存，刷新后可手动重新生成。
        </p>
        <button
          className="solid-button"
          onClick={() => void generate()}
          disabled={busy}
        >
          {busy
            ? "正在生成 AI 解读…"
            : error
              ? "重试 AI 解读"
              : reading
                ? "重新生成当前风格"
                : "生成 AI 初始解读"}
        </button>
      </div>
      {busy && (
        <p className="ai-loading" role="status">
          正在结合你的问题与牌面生成解读，通常需要一些时间。请勿重复提交；牌面不会改变。
        </p>
      )}
      {error && (
        <p className="reading-error" role="alert">
          {error} 当前牌面已保留，未使用模拟解读替代。
        </p>
      )}
      {!reading && !busy && !error && (
        <p className="muted ai-empty">
          尚未生成解读。选择风格、按需补充背景后开始；默认由 AI 推荐风格。
        </p>
      )}
      {reading && (
        <div className="ai-output">
          <div className="ai-style-recommendation">
            <strong>推荐：{styleLabels[reading.recommendedStyle.style]}</strong>
            <p>{reading.recommendedStyle.reason}</p>
            <small>
              本次采用：{styleLabels[reading.style]}
              {style !== "auto" ? " · 按你的选择" : " · 按 AI 推荐"}
            </small>
          </div>
          <section className="reading-summary">
            <p className="eyebrow">THE OVERALL PICTURE / 整体解读</p>
            <h2 ref={result} tabIndex={-1}>
              把这些线索，放回你的生活。
            </h2>
            <p>{reading.overall}</p>
          </section>
          <section className="ai-output-section">
            <h3>逐牌解读</h3>
            <div className="ai-per-card">
              {reading.cardReadings.map((item, index) => (
                <article key={item.cardId}>
                  <p className="eyebrow">
                    {item.position} · {session.cards[index].card.name} ·{" "}
                    {item.orientation === "upright" ? "正位" : "逆位"}
                  </p>
                  <p>{item.interpretation}</p>
                </article>
              ))}
            </div>
          </section>
          <section className="ai-output-section">
            <h3>牌面之间的关联</h3>
            {reading.connections.map((connection, index) => (
              <article key={index}>
                <p className="eyebrow">
                  {connection.cardIds
                    .map(
                      (id) =>
                        session.cards.find((item) => item.card.id === id)?.card
                          .name,
                    )
                    .join(" / ")}
                </p>
                <p>{connection.text}</p>
              </article>
            ))}
          </section>
          <section className="ai-output-section">
            <h3>回到你的问题</h3>
            <p>{reading.questionConnection}</p>
          </section>
          <div className="ai-reflection-grid">
            <section>
              <h3>不确定性</h3>
              <ul>
                {reading.uncertainties.map((text, index) => (
                  <li key={index}>{text}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3>需要你确认</h3>
              <ul>
                {reading.confirmationQuestions.map((text, index) => (
                  <li key={index}>{text}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3>留给你的反思</h3>
              <ul>
                {reading.reflectionPrompts.map((text, index) => (
                  <li key={index}>{text}</li>
                ))}
              </ul>
            </section>
          </div>
          <p className="ai-privacy-note">
            以上内容由 AI
            生成，仅作象征性解读与自我反思。模型可能出错；它不了解未经你明确提供的背景，也无法确定未来或他人的想法。
          </p>
        </div>
      )}
    </section>
  );
}
