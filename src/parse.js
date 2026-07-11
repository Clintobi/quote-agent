import Anthropic from "@anthropic-ai/sdk";

// Turn a free-text service request into structured line items. With a key,
// Claude does the parse; without one, a bundled example runs so the demo works
// offline. Parsing is the ONLY place a model is used — matching and pricing are
// fully deterministic, which is the whole point: no invented prices.
export async function parseRequest(text, { apiKey } = {}) {
  if (!apiKey) return { items: mockParse(), via: "mock" };

  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    system:
      "Extract the products and services a tradesperson must quote from a customer's " +
      'service request. Return ONLY JSON: {"items":[{"query":"<short product name>","qty":<number>}]}. ' +
      "One entry per distinct item. No prose, no code fences.",
    messages: [{ role: "user", content: text }],
  });
  const t = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const cleaned = t.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  return { items: JSON.parse(cleaned).items, via: "claude" };
}

function mockParse() {
  return [
    { query: "50 gallon water heater", qty: 1 },
    { query: "thermostatic mixing valve", qty: 2 },
    { query: "copper pipe 3/4", qty: 15 },
    { query: "full system descale", qty: 1 },
  ];
}
