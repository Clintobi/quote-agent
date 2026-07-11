# devis-agent

Reads a free-text French repair request, matches each item to a real supplier catalog, and generates a PDF quote. The one rule it never breaks: **it does not invent prices.** If an item has no confident catalog match, it gets flagged for a human to price, not guessed by a model.

That constraint is the entire job. A quoting tool that hallucinates a price for a part that isn't in the catalog is worse than useless — it costs the tradesman money on every job. So here the model only ever *reads* the request; matching and pricing are fully deterministic against the catalog.

## How it works

```
French request ──► parse (LLM: text → line items) ──► match each item to catalog
                                                          │
                                              confident?  ├─ yes ─► priced line (real SKU, real price)
                                                          └─ no  ─► FLAGGED for manual pricing
                                                          │
                              margin + labor + Swiss VAT (8.1%) ──► PDF quote
```

The model does one thing: turn messy free text into structured items. Everything that touches money (which SKU, which price, the totals) is plain deterministic code.

## Run it

```bash
npm install
npm start        # runs on data/sample-request.txt, writes out/devis.pdf
```

Runs offline: with no `ANTHROPIC_API_KEY`, it uses a bundled parse of the sample request so you can see the whole flow. Add a key and it parses arbitrary French requests with `claude-opus-4-8`.

## Sample output

```
Demande client:
Bonjour, il faut remplacer le chauffe-eau 200 litres, changer 2 robinets
thermostatiques et prevoir 5 metres de tube cuivre 18mm. Prevoir aussi un
detartrage complet du circuit. Merci.

Matched to catalog (real SKU + real price):
  CE-200   Chauffe-eau electrique 200L   1 x 489 = 489 CHF
  RT-15    Robinet thermostatique 1/2    2 x 42.5 = 85 CHF
  TC-18    Tube cuivre 18mm metre        5 x 7.9 = 39.5 CHF

Flagged — no confident match, NOT auto-priced:
  - detartrage complet du circuit

TOTAL 1070.76 CHF
PDF written: out/devis.pdf
```

The "détartrage" line is the point: it's a service, not a catalog product, so the tool refuses to price it and hands it to the human instead of inventing a number.

## Make it yours

- **Real catalog:** replace `data/catalog.json` with the supplier's actual SKUs and prices. Matching adapts automatically.
- **Tune pricing:** margin %, labor rate, and VAT are options in `src/quote.js`.
- **Confidence floor:** `matchItem(..., floor)` in `src/match.js` controls how sure a match must be before it's priced (raise it to flag more, lower it to auto-price more).

Built by Clinton, VNSIS. Parsing runs on `claude-opus-4-8`.
