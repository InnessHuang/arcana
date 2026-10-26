import { z } from "zod";
import { spreads } from "../home-content";
import { tarotCards } from "../tarot/cards";
import type { ReadingSession } from "../tarot/session";

export const styleSchema = z.enum(["traditional", "rational", "hybrid"]);
export type ReadingStyle = z.infer<typeof styleSchema>;
export const styleLabels: Record<ReadingStyle, string> = {
  traditional: "传统塔罗",
  rational: "理性分析",
  hybrid: "混合风格",
};
const shortText = z.string().trim().min(1).max(100);
const orientationSchema = z.enum(["upright", "reversed"]);
const requestBase = z
  .object({
    question: z.string().trim().min(4).max(300),
    background: z.string().trim().max(1000).default(""),
    style: z
      .enum(["auto", "traditional", "rational", "hybrid"])
      .default("auto"),
    spread: z
      .object({
        id: shortText,
        name: shortText,
        positions: z.array(shortText).min(1).max(3),
      })
      .strict(),
    cards: z
      .array(
        z
          .object({
            id: shortText,
            name: shortText,
            position: shortText,
            orientation: orientationSchema,
            keywords: z.array(shortText).min(1).max(6),
            meaning: z.string().min(1).max(1000),
          })
          .strict(),
      )
      .min(1)
      .max(3),
  })
  .strict();
export const readingRequestSchema = requestBase.superRefine((input, ctx) => {
  const spread = spreads.find((spread) => spread.id === input.spread.id);
  if (
    !spread ||
    spread.name !== input.spread.name ||
    JSON.stringify(spread.positions) !==
      JSON.stringify(input.spread.positions) ||
    spread.count !== input.cards.length
  ) {
    ctx.addIssue({
      code: "custom",
      message: "牌阵与牌位不匹配",
      path: ["spread"],
    });
    return;
  }
  const ids = new Set<string>();
  input.cards.forEach((item, index) => {
    const canonical = tarotCards.find((card) => card.id === item.id);
    if (
      !canonical ||
      ids.has(item.id) ||
      item.position !== spread.positions[index] ||
      item.name !== canonical.name ||
      JSON.stringify(item.keywords) !== JSON.stringify(canonical.keywords) ||
      item.meaning !== canonical[item.orientation]
    ) {
      ctx.addIssue({
        code: "custom",
        message: "牌面与牌库或牌位不匹配",
        path: ["cards", index],
      });
    }
    ids.add(item.id);
  });
});
export type ReadingRequest = z.infer<typeof readingRequestSchema>;
const paragraph = z.string().trim().min(1).max(2000);
export const aiReadingSchema = z
  .object({
    recommendedStyle: z
      .object({ style: styleSchema, reason: z.string().trim().min(1).max(500) })
      .strict(),
    style: styleSchema,
    overall: paragraph,
    cardReadings: z
      .array(
        z
          .object({
            cardId: shortText,
            position: shortText,
            orientation: orientationSchema,
            interpretation: paragraph,
          })
          .strict(),
      )
      .min(1)
      .max(3),
    connections: z
      .array(
        z
          .object({
            cardIds: z.array(shortText).min(1).max(3),
            text: paragraph,
          })
          .strict(),
      )
      .min(1)
      .max(4),
    questionConnection: paragraph,
    uncertainties: z.array(z.string().trim().min(1).max(500)).min(1).max(5),
    confirmationQuestions: z
      .array(z.string().trim().min(1).max(500))
      .min(1)
      .max(5),
    reflectionPrompts: z.array(z.string().trim().min(1).max(500)).min(1).max(5),
  })
  .strict();
export type AIReading = z.infer<typeof aiReadingSchema>;

export function parseAIReading(
  value: unknown,
  input: ReadingRequest,
): AIReading {
  const result = aiReadingSchema.parse(value);
  if (
    result.cardReadings.length !== input.cards.length ||
    result.cardReadings.some(
      (item, index) =>
        item.cardId !== input.cards[index].id ||
        item.position !== input.cards[index].position ||
        item.orientation !== input.cards[index].orientation,
    )
  )
    throw new Error("模型更改了牌面或牌位");
  const ids = new Set(input.cards.map((card) => card.id));
  if (
    result.connections.some(
      (connection) =>
        new Set(connection.cardIds).size !== connection.cardIds.length ||
        connection.cardIds.some((id) => !ids.has(id)) ||
        (input.cards.length > 1 && connection.cardIds.length < 2),
    )
  )
    throw new Error("牌面关联无效");
  if (
    result.style !==
    (input.style === "auto" ? result.recommendedStyle.style : input.style)
  )
    throw new Error("模型未遵循解读风格");
  return result;
}
export function makeReadingRequest(
  session: ReadingSession,
  style: ReadingRequest["style"],
  background: string,
): ReadingRequest {
  return {
    question: session.question,
    background,
    style,
    spread: {
      id: session.spread.id,
      name: session.spread.name,
      positions: [...session.spread.positions],
    },
    cards: session.cards.map((item) => ({
      id: item.card.id,
      name: item.card.name,
      position: item.position,
      orientation: item.orientation,
      keywords: [...item.card.keywords],
      meaning: item.card[item.orientation],
    })),
  };
}
