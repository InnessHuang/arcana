import { spreads, type Spread } from "../home-content";
import { tarotCards } from "./cards";
import type { DrawnCard } from "./draw";

const KEY = "arcana-reading-v1";
export interface ReadingSession {
  question: string;
  spread: Spread;
  cards: DrawnCard[];
}
export function saveSession(session: ReadingSession) {
  sessionStorage.setItem(
    KEY,
    JSON.stringify({
      question: session.question,
      spreadId: session.spread.id,
      cards: session.cards.map((item) => ({
        id: item.card.id,
        orientation: item.orientation,
      })),
    }),
  );
}
export function readSession(): ReadingSession | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  const data = JSON.parse(raw);
  if (
    !data ||
    typeof data.question !== "string" ||
    data.question.trim().length < 4 ||
    data.question.length > 300
  )
    throw new Error("问题数据无效");
  const spread = spreads.find((item) => item.id === data.spreadId);
  if (
    !spread ||
    !Array.isArray(data.cards) ||
    (data.cards.length !== 0 && data.cards.length !== spread.count)
  )
    throw new Error("牌阵数据无效");
  const ids = new Set<string>();
  const cards: DrawnCard[] = data.cards.map(
    (item: { id?: unknown; orientation?: unknown }, index: number) => {
      if (!item) throw new Error("牌面数据无效");
      const card = tarotCards.find((card) => card.id === item.id);
      if (
        !card ||
        ids.has(card.id) ||
        (item.orientation !== "upright" && item.orientation !== "reversed")
      )
        throw new Error("牌面数据无效");
      ids.add(card.id);
      return {
        card,
        orientation: item.orientation,
        position: spread.positions[index],
      };
    },
  );
  return { question: data.question.trim(), spread, cards };
}
