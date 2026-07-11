import { matchItem } from "./match.js";

const round = (n) => Math.round(n * 100) / 100;

// Build a quote from parsed items. Matched items become priced lines; anything
// without a confident catalog match goes to `flagged` (priced by a human, never
// by the model). Then markup, labor, and tax on top. Rates are options — set
// your region's tax (US sales tax, UK/EU VAT, etc.) here.
export function buildQuote(parsed, catalog, opts = {}) {
  const { markupPct = 0.15, laborHours = 3, laborRate = 95, taxPct = 0.08 } = opts;

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
  const markup = round(subtotal * markupPct);
  const labor = round(laborHours * laborRate);
  const base = round(subtotal + markup + labor);
  const tax = round(base * taxPct);
  const total = round(base + tax);

  return { lines, flagged, subtotal, markup, labor, tax, total, opts: { markupPct, laborHours, laborRate, taxPct } };
}
