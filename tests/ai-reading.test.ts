import test from "node:test";
import assert from "node:assert/strict";
import { spreads } from "../src/lib/home-content";
import { drawCards } from "../src/lib/tarot/draw";
import {
  makeReadingRequest,
  readingRequestSchema,
  parseAIReading,
  type AIReading,
  type ReadingRequest,
} from "../src/lib/ai/contracts";
import {
  generateReading,
  ReadingAPIError,
  type DeepSeekConfig,
} from "../src/lib/ai/deepseek";
import { createReadingHandler } from "../src/lib/ai/handler";

// Fictional marker only. Never loads environment credentials or contacts a provider.
const config: DeepSeekConfig = {
  apiKey: "fictional-unit-test-marker",
  endpoint: "https://api.deepseek.com/chat/completions",
  model: "deepseek-chat",
  timeoutMs: 1000,
  temperature: 0.6,
  maxTokens: 4000,
};
const input = makeReadingRequest(
  {
    question: "如何理解工作中的犹豫？",
    spread: spreads[1],
    cards: drawCards(spreads[1].positions, () => 0.8),
  },
  "auto",
  "我正在考虑换工作，尚未做出决定。",
);
function validReading(request: ReadingRequest = input): AIReading {
  return {
    recommendedStyle: { style: "hybrid", reason: "结合象征与处境分析。" },
    style: request.style === "auto" ? "hybrid" : request.style,
    overall: "你的问题涉及改变与稳定，可以先厘清已知条件。",
    cardReadings: request.cards.map((card) => ({
      cardId: card.id,
      position: card.position,
      orientation: card.orientation,
      interpretation: `结合${card.position}与${card.meaning}，可以检查与原问题相关的感受。`,
    })),
    connections: [
      {
        cardIds: request.cards.map((card) => card.id),
        text: "这些牌提供不同的观察角度，不是确定结论。",
      },
    ],
    questionConnection: "换工作的犹豫是你提出的问题，具体工作条件仍待确认。",
    uncertainties: ["尚不清楚实际工作安排。"],
    confirmationQuestions: ["改变最重要的条件是什么？"],
    reflectionPrompts: ["哪些是可验证的事实？"],
  };
}
const envelope = (reading: unknown = validReading(), finish = "stop") =>
  Response.json({
    choices: [
      {
        finish_reason: finish,
        message: {
          content:
            typeof reading === "string" ? reading : JSON.stringify(reading),
        },
      },
    ],
  });
function request(body: unknown = input, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/reading", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
const matchesCode = (code: string) => (error: unknown) =>
  error instanceof ReadingAPIError && error.code === code;

test("valid input includes canonical cards, positions, orientation and optional background", () => {
  assert.deepEqual(readingRequestSchema.parse(input), input);
  for (const spread of spreads) {
    const value = makeReadingRequest(
      {
        question: input.question,
        spread,
        cards: drawCards(spread.positions, () => 0),
      },
      "traditional",
      "",
    );
    assert(readingRequestSchema.safeParse(value).success);
    assert.deepEqual(
      parseAIReading(validReading(value), value),
      validReading(value),
    );
  }
});
test("rejects empty question, oversized/unknown input and forged spread/card fields", () => {
  const mutations: unknown[] = [
    { ...input, question: " " },
    { ...input, question: "a".repeat(301) },
    { ...input, background: "a".repeat(1001) },
    { ...input, style: "unknown" },
    { ...input, extra: "untrusted" },
    { ...input, spread: { ...input.spread, name: "伪造牌阵" } },
    {
      ...input,
      spread: {
        ...input.spread,
        positions: [...input.spread.positions].reverse(),
      },
    },
    { ...input, cards: input.cards.slice(1) },
    { ...input, cards: [input.cards[0], input.cards[0], input.cards[2]] },
  ];
  for (const key of [
    "id",
    "name",
    "position",
    "meaning",
    "orientation",
    "keywords",
  ]) {
    mutations.push({
      ...input,
      cards: input.cards.map((card, i) =>
        i
          ? card
          : {
              ...card,
              [key]: key === "keywords" ? ["伪造关键词"] : "伪造数据",
            },
      ),
    });
  }
  for (const value of mutations)
    assert.equal(readingRequestSchema.safeParse(value).success, false);
});
test("strict output matching rejects omitted, extra, substituted, reordered cards and bad relations", () => {
  const good = validReading();
  const values: unknown[] = [
    { ...good, cardReadings: good.cardReadings.slice(1) },
    { ...good, cardReadings: [...good.cardReadings, good.cardReadings[0]] },
    { ...good, cardReadings: [...good.cardReadings].reverse() },
    { ...good, connections: [{ cardIds: ["not-drawn"], text: "错误关联" }] },
    { ...good, style: "rational" },
    { ...good, overall: "" },
    { ...good, extra: "unexpected" },
    { ...good, uncertainties: [] },
  ];
  for (const key of ["cardId", "position", "orientation"]) {
    values.push({
      ...good,
      cardReadings: good.cardReadings.map((card, i) =>
        i ? card : { ...card, [key]: "wrong" },
      ),
    });
  }
  for (const value of values) assert.throws(() => parseAIReading(value, input));
});
test("user style wins over AI recommendation", () => {
  const explicit = { ...input, style: "rational" as const };
  const reading = validReading(explicit);
  assert.equal(parseAIReading(reading, explicit).style, "rational");
  assert.equal(reading.recommendedStyle.style, "hybrid");
  assert.throws(() =>
    parseAIReading({ ...reading, style: "hybrid" }, explicit),
  );
});
test("provider success sends secret only via Authorization and returns validated reading", async () => {
  let calls = 0;
  const fetcher: typeof fetch = async (url, init) => {
    calls++;
    assert.equal(url, config.endpoint);
    assert.equal(init?.redirect, "error");
    assert.equal(init?.cache, "no-store");
    assert.equal(
      new Headers(init?.headers).get("Authorization"),
      `Bearer ${config.apiKey}`,
    );
    assert(!String(init?.body).includes(config.apiKey));
    const body = JSON.parse(String(init?.body));
    assert.deepEqual(body.response_format, { type: "json_object" });
    assert.equal(body.model, config.model);
    assert.equal(body.stream, false);
    assert.deepEqual(JSON.parse(body.messages[1].content), input);
    assert(body.messages[0].content.includes("不得新增"));
    return envelope();
  };
  const result = await generateReading(input, config, fetcher);
  assert.deepEqual(result, validReading());
  assert.equal(calls, 1);
  assert(!JSON.stringify(result).includes(config.apiKey));
});
test("provider failures are mapped without leaking raw errors or credentials", async () => {
  for (const [status, code] of [
    [401, "PROVIDER_AUTH"],
    [402, "PROVIDER_AUTH"],
    [403, "PROVIDER_AUTH"],
    [429, "RATE_LIMITED"],
    [500, "PROVIDER_ERROR"],
    [503, "PROVIDER_ERROR"],
  ] as const) {
    await assert.rejects(
      generateReading(
        input,
        config,
        async () => new Response(config.apiKey, { status }),
      ),
      matchesCode(code),
    );
  }
  await assert.rejects(
    generateReading(input, config, async () => {
      throw new Error(config.apiKey);
    }),
    matchesCode("PROVIDER_ERROR"),
  );
});
test("malformed JSON, partial completions, unknown schema and credential echo rejected", async () => {
  for (const factory of [
    () => new Response("not-json"),
    () => envelope("{broken"),
    () => envelope(validReading(), "length"),
    () => envelope({ ...validReading(), cardReadings: [] }),
    () => envelope({ ...validReading(), overall: config.apiKey }),
    () => new Response(" ".repeat(96001)),
  ]) {
    await assert.rejects(
      generateReading(input, config, async () => factory()),
      matchesCode("INVALID_OUTPUT"),
    );
  }
  // Also reject an escaped marker after parsing provider JSON.
  const escaped = JSON.stringify({
    choices: [
      {
        finish_reason: "stop",
        message: {
          content: JSON.stringify({
            ...validReading(),
            overall: config.apiKey,
          }),
        },
      },
    ],
  }).replaceAll("fictional", "\\u0066ictional");
  await assert.rejects(
    generateReading(input, config, async () => new Response(escaped)),
    matchesCode("INVALID_OUTPUT"),
  );
});
test("timeout covers a stalled fetch and a stalled response body", async () => {
  const fast = { ...config, timeoutMs: 10 };
  await assert.rejects(
    generateReading(input, fast, () => new Promise(() => {})),
    matchesCode("TIMEOUT"),
  );
  await assert.rejects(
    generateReading(
      input,
      fast,
      async () => new Response(new ReadableStream({ start() {} })),
    ),
    matchesCode("TIMEOUT"),
  );
});
test("cancelled request does not call provider", async () => {
  const abort = new AbortController();
  abort.abort();
  let calls = 0;
  await assert.rejects(
    generateReading(
      input,
      config,
      async () => {
        calls++;
        return envelope();
      },
      abort.signal,
    ),
    matchesCode("CANCELLED"),
  );
  assert.equal(calls, 0);
});
test("route validates before provider, handles bad JSON, size, content type and origin", async () => {
  let calls = 0;
  const handler = createReadingHandler(
    () => config,
    async () => {
      calls++;
      return envelope();
    },
  );
  for (const [req, status] of [
    [request({ ...input, question: "" }), 400],
    [request("{bad"), 400],
    [request("x".repeat(16001)), 413],
    [request(input, { "Content-Type": "text/plain" }), 400],
    [request(input, { origin: "https://other.example" }), 400],
  ] as const) {
    const response = await handler(req);
    assert.equal(response.status, status);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
  assert.equal(calls, 0);
});
test("route success is structured and failures are safe, retryable responses", async () => {
  const success = await createReadingHandler(
    () => config,
    async () => envelope(),
  )(request());
  assert.equal(success.status, 200);
  assert.deepEqual(await success.json(), { reading: validReading() });
  for (const [status, code] of [
    [429, "RATE_LIMITED"],
    [401, "PROVIDER_AUTH"],
    [500, "PROVIDER_ERROR"],
  ] as const) {
    const response = await createReadingHandler(
      () => config,
      async () => new Response(config.apiKey, { status }),
    )(request());
    const text = await response.text();
    assert(!text.includes(config.apiKey));
    assert.equal(JSON.parse(text).error.code, code);
    if (status === 429) assert.equal(response.headers.get("retry-after"), "30");
  }
  const missing = await createReadingHandler(() => {
    throw new ReadingAPIError("NOT_CONFIGURED");
  })(request());
  assert.equal(missing.status, 503);
  assert.equal((await missing.json()).error.code, "NOT_CONFIGURED");
  const timeout = await createReadingHandler(
    () => ({ ...config, timeoutMs: 10 }),
    () => new Promise(() => {}),
  )(request());
  assert.equal(timeout.status, 504);
  const malformed = await createReadingHandler(
    () => config,
    async () => envelope("bad"),
  )(request());
  assert.equal(malformed.status, 502);
});

test("origin validation uses incoming Host when Next normalizes its internal URL", async () => {
  const handler = createReadingHandler(
    () => config,
    async () => envelope(),
  );
  const response = await handler(
    request(input, { host: "127.0.0.1:3003", origin: "http://127.0.0.1:3003" }),
  );
  assert.equal(response.status, 200);
  for (const origin of ["null", "not-a-url", "https://other.example"]) {
    assert.equal(
      (await handler(request(input, { host: "127.0.0.1:3003", origin })))
        .status,
      400,
    );
  }
});
