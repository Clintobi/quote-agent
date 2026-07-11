import PDFDocument from "pdfkit";
import { createWriteStream, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const CHF = (n) => n.toFixed(2) + " CHF";

// Render the quote to a PDF. Returns a promise that resolves when the file is
// fully written to disk.
export function writePdf(quote, meta, outPath) {
  mkdirSync(dirname(outPath), { recursive: true });
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const stream = createWriteStream(outPath);
  doc.pipe(stream);

  doc.fontSize(10).fillColor("#666").text("VNSIS", 50, 50);
  doc.fontSize(22).fillColor("#000").text("DEVIS", { align: "right" });
  doc.fontSize(10).fillColor("#666").text(meta.date, { align: "right" });
  doc.moveDown(2).fillColor("#000").fontSize(11);

  quote.lines.forEach((l) => {
    doc.text(`${l.sku}   ${l.label}`, { continued: true });
    doc.text(`${l.qty} x ${CHF(l.unitPrice)}  =  ${CHF(l.total)}`, { align: "right" });
  });

  if (quote.flagged.length) {
    doc.moveDown().fontSize(10).fillColor("#b00020");
    doc.text("A chiffrer manuellement (non trouve au catalogue) :");
    quote.flagged.forEach((f) => doc.text("   - " + f));
    doc.fillColor("#000").fontSize(11);
  }

  doc.moveDown();
  const row = (k, v) => {
    doc.text(k, { continued: true });
    doc.text(CHF(v), { align: "right" });
  };
  row("Sous-total materiel", quote.subtotal);
  row(`Marge (${(quote.opts.marginPct * 100).toFixed(0)}%)`, quote.margin);
  row(`Main d'oeuvre (${quote.opts.laborHours}h)`, quote.labor);
  row(`TVA (${(quote.opts.vatPct * 100).toFixed(1)}%)`, quote.vat);
  doc.moveDown(0.5).fontSize(14);
  doc.text("TOTAL", { continued: true });
  doc.text(CHF(quote.total), { align: "right" });

  doc.end();
  return new Promise((resolve) => stream.on("finish", () => resolve(outPath)));
}
