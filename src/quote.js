import { matchItem } from "./match.js";

const round = (n) => Math.round(n * 100) / 100;

// Build a quote from parsed items. Matched items become priced lines; anything
// without a confident catalog match goes to `flagged` (priced by a human, never
// by the model). Then margin, labor, and Swiss VAT (8.1%) on top.
export function buildQuote(parsed, catalog, opts = {}) {
  const { marginPct = 0.15, laborHours = 3, laborRate = 95, vatPct = 0.081 } = opts;

  const lines = [];
  const flagged = [];
  for (const item of parsed) {
    const m = matchItem(item.query, catalog);
    if (!m) {
      flagged.push(item.query);
      continue;
    }
    lines.push({ sku: m.sku, label: m.label, qty: item.qty, unitPrice: m.price, total: round(item.qty * m.price) });
  }

  const subtotal = round(lines.reduce((s, l) => s + l.total, 0));
  const margin = round(subtotal * marginPct);
  const labor = round(laborHours * laborRate);
  const base = round(subtotal + margin + labor);
  const vat = round(base * vatPct);
  const total = round(base + vat);

  return { lines, flagged, subtotal, margin, labor, vat, total, opts: { marginPct, laborHours, laborRate, vatPct } };
}
