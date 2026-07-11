import { readFileSync, existsSync } from "node:fs";
import { parseRequest } from "./parse.js";
import { buildQuote } from "./quote.js";
import { writePdf } from "./pdf.js";

// Minimal .env loader (no dependency).
if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const apiKey = process.env.ANTHROPIC_API_KEY;
const catalog = JSON.parse(readFileSync("data/catalog.json", "utf8"));
const request = readFileSync("data/sample-request.txt", "utf8");

console.log("\nCustomer request:\n" + request.trim() + "\n");

const { items, via } = await parseRequest(request, { apiKey });
console.log(`Parsed ${items.length} items (via ${via}).\n`);

const quote = buildQuote(items, catalog);

console.log("Matched to catalog (real SKU + real price):");
quote.lines.forEach((l) => console.log(`  ${l.sku}   ${l.label}   ${l.qty} x $${l.unitPrice} = $${l.total}`));
if (quote.flagged.length) {
  console.log("\nFlagged — no confident match, NOT auto-priced:");
  quote.flagged.forEach((f) => console.log("  - " + f));
}
console.log(`\nSubtotal $${quote.subtotal}  Markup $${quote.markup}  Labor $${quote.labor}  Tax $${quote.tax}`);
console.log(`TOTAL $${quote.total}`);

const out = await writePdf(quote, { date: new Date().toLocaleDateString("en-US") }, "out/quote.pdf");
console.log(`\nPDF written: ${out}`);
