"use client";

import { useEffect, useRef, useState } from "react";
import type { Spread } from "@/lib/home-content";
import { TarotArt } from "./artwork";

export function ExplorationDialog({
  session,
  onClose,
}: {
  session: { question: string; spread: Spread } | null;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    if (session && element && !element.open) {
      element.showModal();
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        element.close();
        document.body.style.overflow = previous;
      };
    }
  }, [session]);
  return (
    <dialog
      ref={dialog}
      className="exploration-dialog"
      aria-labelledby="exploration-title"
      onCancel={onClose}
      onClose={onClose}
    >
      {session && (
        <div className="dialog-content">
          <button
            className="close-button"
            onClick={onClose}
            aria-label="关闭探索演示"
          >
            ×
          </button>
          <p className="eyebrow">EXPLORATION PREVIEW · 前端演示</p>
          <h2 id="exploration-title">{session.spread.name}</h2>
          <p className="dialog-question">{session.question}</p>
          <p className="muted">
            {revealed
              ? "以下是固定示例牌面，用来预览流程，不构成针对你的问题的解读。"
              : "带着你的问题，留一点时间给自己。准备好后，翻开示例牌面。"}
          </p>
          <div className="preview-cards">
            {session.spread.positions.map((position, i) => (
              <div key={position}>
                <TarotArt
                  variant={revealed ? (i === 1 ? "moon" : "sun") : "back"}
                />
                <p>{position}</p>
              </div>
            ))}
          </div>
          <div aria-live="polite">
            {revealed && (
              <div className="reflection-note">
                <strong>试着从这里继续思考</strong>
                <p>
                  这个问题里，哪些是你能够影响的？如果只做一件小事，你愿意从哪里开始？
                </p>
                <small>
                  通用反思提示 · 非 AI
                  生成；本次输入仅用于当前页面展示，刷新后不保留。
                </small>
              </div>
            )}
          </div>
          {!revealed ? (
            <button className="solid-button" onClick={() => setRevealed(true)}>
              翻开示例牌面 <span aria-hidden="true">↗</span>
            </button>
          ) : (
            <button className="solid-button" onClick={onClose}>
              带着新的视角，回到首页
            </button>
          )}
          <p className="demo-disclaimer">
            此处仅演示提问与翻牌流程，未接入 AI 或保存记录。
          </p>
        </div>
      )}
    </dialog>
  );
}
