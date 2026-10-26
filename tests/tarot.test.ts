import test from "node:test";
import assert from "node:assert/strict";
import { tarotCards } from "../src/lib/tarot/cards";
import { drawCards } from "../src/lib/tarot/draw";
import { spreads } from "../src/lib/home-content";
import { describeCard, summarize } from "../src/lib/tarot/reading";
import { readSession, saveSession } from "../src/lib/tarot/session";

test("complete 78-card deck with unique IDs, names and meanings", () => {
  assert.equal(tarotCards.length, 78);
  assert.equal(new Set(tarotCards.map((card) => card.id)).size, 78);
  assert.equal(new Set(tarotCards.map((card) => card.name)).size, 78);
  assert.equal(tarotCards.filter((card) => card.arcana === "major").length, 22);
  assert.equal(tarotCards.filter((card) => card.arcana === "minor").length, 56);
  for (const card of tarotCards) {
    assert(card.upright && card.reversed && card.keywords.length);
    assert.notEqual(card.upright, card.reversed);
  }
});
test("each spread keeps exact count, order and positions without duplicates", () => {
  for (const spread of spreads) {
    assert.equal(spread.count, spread.positions.length);
    for (let run = 0; run < 100; run++) {
      const result = drawCards(spread.positions);
      assert.equal(result.length, spread.count);
      assert.equal(
        new Set(result.map((item) => item.card.id)).size,
        spread.count,
      );
      assert.deepEqual(
        result.map((item) => item.position),
        [...spread.positions],
      );
    }
  }
});
test("all 78 can be drawn without replacement, even at random boundaries", () => {
  for (const random of [() => 0, () => 0.999999]) {
    const result = drawCards(
      Array.from({ length: 78 }, (_, i) => String(i)),
      random,
    );
    assert.equal(new Set(result.map((item) => item.card.id)).size, 78);
  }
});
test("orientation and draw are reproducible using injected random source", () => {
  const values = [0, 0, 0, 0.9, 0, 0.49];
  let index = 0;
  const result = drawCards(spreads[1].positions, () => values[index++]);
  assert.deepEqual(
    result.map((item) => item.orientation),
    ["upright", "reversed", "upright"],
  );
  assert.deepEqual(
    result.map((item) => item.card.id),
    ["major-0", "major-1", "major-2"],
  );
});
test("invalid draw counts and random sources are rejected", () => {
  assert.throws(() => drawCards([]));
  assert.throws(() => drawCards(Array(79).fill("牌位")));
  for (const value of [-1, 1, NaN, Infinity])
    assert.throws(() => drawCards(["牌位"], () => value));
});
test("interpretation carries question, position, orientation and correct meaning", () => {
  const cards = drawCards(spreads[1].positions, () => 0.9);
  const question = "如何理解工作中的犹豫？";
  for (const item of cards) {
    const text = describeCard(question, item);
    for (const part of [
      question,
      item.position,
      item.card.name,
      "逆位",
      item.card.reversed,
    ])
      assert(text.includes(part));
  }
  const summary = summarize(question, spreads[1], cards);
  assert(
    summary.includes(question) &&
      summary.includes(spreads[1].name) &&
      summary.includes("本地模板"),
  );
});
test("session roundtrip and corrupt data validation", () => {
  const data = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
    key: (index) => [...data.keys()][index] ?? null,
  };
  Object.defineProperty(globalThis, "sessionStorage", {
    value: storage,
    configurable: true,
  });
  assert.equal(readSession(), null);
  const session = {
    question: "如何开始一个新的计划？",
    spread: spreads[1],
    cards: drawCards(spreads[1].positions, () => 0),
  };
  saveSession(session);
  assert.deepEqual(readSession(), session);
  saveSession({ ...session, cards: [] });
  assert.deepEqual(readSession()?.cards, []);
  for (const invalid of [
    "{",
    "null",
    JSON.stringify({ question: " ", spreadId: "path", cards: [] }),
    JSON.stringify({
      question: session.question,
      spreadId: "unknown",
      cards: [],
    }),
    JSON.stringify({
      question: session.question,
      spreadId: "path",
      cards: [{ id: "major-0", orientation: "up" }],
    }),
    JSON.stringify({
      question: session.question,
      spreadId: "path",
      cards: Array(3).fill({ id: "major-0", orientation: "upright" }),
    }),
  ]) {
    storage.setItem("arcana-reading-v1", invalid);
    assert.throws(() => readSession());
  }
  delete (globalThis as { sessionStorage?: Storage }).sessionStorage;
});
