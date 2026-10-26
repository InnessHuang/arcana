import { tarotCards, type TarotCard } from "./cards";

export interface DrawnCard {
  card: TarotCard;
  orientation: "upright" | "reversed";
  position: string;
}

// Injectable random source makes selection, orientation and edge cases testable.
export function drawCards(
  positions: readonly string[],
  random: () => number = Math.random,
): DrawnCard[] {
  if (!positions.length || positions.length > tarotCards.length)
    throw new Error("牌位数量无效");
  const remaining = [...tarotCards];
  function sample() {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1)
      throw new Error("随机数来源不可用，请重试");
    return value;
  }
  return positions.map((position) => {
    const index = Math.floor(sample() * remaining.length);
    const [card] = remaining.splice(index, 1);
    return {
      card,
      position,
      orientation: sample() < 0.5 ? "upright" : "reversed",
    };
  });
}
