import Anthropic from "@anthropic-ai/sdk";

// Turn a free-text French repair request into structured line items.
// With a key, Claude does the parse; without one, a bundled example runs so the
// demo works offline. Parsing is the ONLY place a model is used — matching and
// pricing are fully deterministic, which is the whole point: no invented prices.
export async function parseRequest(text, { apiKey } = {}) {
  if (!apiKey) return { items: mockParse(), via: "mock" };

  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    system:
      "Extract the products and services a plumber must quote from a French repair " +
      'request. Return ONLY JSON: {"items":[{"query":"<short product name in French>","qty":<number>}]}. ' +
      "One entry per distinct item. No prose, no code fences.",
    messages: [{ role: "user", content: text }],
  });
  const t = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const cleaned = t.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  return { items: JSON.parse(cleaned).items, via: "claude" };
}

function mockParse() {
  return [
    { query: "chauffe-eau 200 litres", qty: 1 },
    { query: "robinet thermostatique", qty: 2 },
    { query: "tube cuivre 18mm", qty: 5 },
    { query: "detartrage complet du circuit", qty: 1 },
  ];
}
