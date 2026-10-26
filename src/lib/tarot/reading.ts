import type { Spread } from "../home-content";
import type { DrawnCard } from "./draw";

export function describeCard(question: string, item: DrawnCard) {
  const meaning = item.card[item.orientation];
  return `围绕「${question}」，把「${item.position}」作为观察角度：${item.card.name}${item.orientation === "reversed" ? "逆位" : "正位"}的常见象征是「${item.card.keywords.join("、")}」。牌义提示：${meaning}。这与你的实际经历有哪些相似或不同？请以你掌握的事实为准，而不是把牌义当作结论。`;
}
export function summarize(
  question: string,
  spread: Spread,
  cards: DrawnCard[],
) {
  return `对于「${question}」，「${spread.name}」提供了${cards.length}个观察切面：${cards.map((item) => `从「${item.position}」关注${item.card.keywords.join("与")}`).join("；")}。可以先挑一个最贴近处境的线索核实，再决定下一步。这是依据牌位与牌义拼接的本地模板，没有理解或判断你的个人处境。`;
}
