// Deterministic catalog matching. No model here on purpose: a quote must only
// ever reference a real SKU at a real price. If nothing clears the confidence
// floor, the item is flagged for a human — never guessed.

const STOP = new Set([
  "le", "la", "les", "un", "une", "des", "de", "du", "et", "ou", "pour",
  "avec", "au", "aux", "en", "the",
]);

const norm = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[^a-z0-9\s]/g, " ");

const toks = (s) => norm(s).split(/\s+/).filter((t) => t.length >= 2 && !STOP.has(t));

function hit(qt, labelToks) {
  if (/^\d+$/.test(qt)) return labelToks.some((lt) => lt.startsWith(qt));
  return labelToks.some((lt) => {
    if (lt === qt) return true;
    const k = Math.min(4, lt.length, qt.length);
    return k >= 3 && lt.slice(0, k) === qt.slice(0, k);
  });
}

// Best deterministic match for a query, or null if below the confidence floor.
export function matchItem(query, catalog, floor = 0.5) {
  const qt = toks(query);
  if (!qt.length) return null;
  let best = null;
  for (const p of catalog) {
    const lt = toks(p.label);
    const score = qt.filter((t) => hit(t, lt)).length / qt.length;
    if (!best || score > best.score) best = { ...p, score };
  }
  return best && best.score >= floor ? best : null;
}
