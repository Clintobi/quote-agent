import PDFDocument from "pdfkit";
import { createWriteStream, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const USD = (n) => "$" + n.toFixed(2);

// Render the quote to a PDF. Returns a promise that resolves when the file is
// fully written to disk.
export function writePdf(quote, meta, outPath) {
  mkdirSync(dirname(outPath), { recursive: true });
  const doc = new PDFDocument({ margin: 50, size: "LETTER" });
  const stream = createWriteStream(outPath);
  doc.pipe(stream);

  doc.fontSize(10).fillColor("#666").text("VNSIS", 50, 50);
  doc.fontSize(22).fillColor("#000").text("QUOTE", { align: "right" });
  doc.fontSize(10).fillColor("#666").text(meta.date, { align: "right" });
  doc.moveDown(2).fillColor("#000").fontSize(11);

  quote.lines.forEach((l) => {
    doc.text(`${l.sku}   ${l.label}`, { continued: true });
    doc.text(`${l.qty} x ${USD(l.unitPrice)}  =  ${USD(l.total)}`, { align: "right" });
  });

  if (quote.flagged.length) {
    doc.moveDown().fontSize(10).fillColor("#b00020");
    doc.text("To be priced manually (not found in catalog):");
    quote.flagged.forEach((f) => doc.text("   - " + f));
    doc.fillColor("#000").fontSize(11);
  }

  doc.moveDown();
  const row = (k, v) => {
    doc.text(k, { continued: true });
    doc.text(USD(v), { align: "right" });
  };
  row("Materials subtotal", quote.subtotal);
  row(`Markup (${(quote.opts.markupPct * 100).toFixed(0)}%)`, quote.markup);
  row(`Labor (${quote.opts.laborHours}h)`, quote.labor);
  row(`Tax (${(quote.opts.taxPct * 100).toFixed(0)}%)`, quote.tax);
  doc.moveDown(0.5).fontSize(14);
  doc.text("TOTAL", { continued: true });
  doc.text(USD(quote.total), { align: "right" });

  doc.end();
  return new Promise((resolve) => stream.on("finish", () => resolve(outPath)));
}
