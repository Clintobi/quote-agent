# quote-agent

Reads a customer's free-text service request, matches each item to a real supplier catalog, and generates a PDF quote. The one rule it never breaks: **it does not invent prices.** If an item has no confident catalog match, it gets flagged for a human to price, not guessed by a model.

That constraint is the entire job. A quoting tool that hallucinates a price for a part that isn't in the catalog is worse than useless — it costs the tradesperson money on every job. So here the model only ever *reads* the request; matching and pricing are fully deterministic against the catalog.

Built for trades (plumbing, HVAC, electrical): a customer texts what they need, you send back a priced PDF in seconds instead of writing it up after hours.

## How it works

```
request ──► parse (LLM: text → line items) ──► match each item to catalog
                                                  │
                                      confident?  ├─ yes ─► priced line (real SKU, real price)
                                                  └─ no  ─► FLAGGED for manual pricing
                                                  │
                              markup + labor + tax ──► PDF quote
```

The model does one thing: turn messy free text into structured items. Everything that touches money (which SKU, which price, the totals) is plain deterministic code.

## Run it

```bash
npm install
npm start        # runs on data/sample-request.txt, writes out/quote.pdf
```

Runs offline: with no `ANTHROPIC_API_KEY`, it uses a bundled parse of the sample request so you can see the whole flow. Add a key and it parses arbitrary requests with `claude-opus-4-8`.

## Sample output

```
Customer request:
Hi, we need to replace a 50 gallon water heater, swap 2 thermostatic mixing
valves, and run about 15 feet of 3/4 copper pipe. Also need a full descale of
the system. Thanks.

Matched to catalog (real SKU + real price):
  WH-50    50 gallon electric water heater   1 x $649 = $649
  TMX-12   Thermostatic mixing valve 1/2 in  2 x $58 = $116
  CU-34    Copper pipe 3/4 in                15 x $4.2 = $63

Flagged — no confident match, NOT auto-priced:
  - full system descale

TOTAL $1336.18
PDF written: out/quote.pdf
```

The "descale" line is the point: it's a service, not a catalog product, so the tool refuses to price it and hands it to the human instead of inventing a number.

## Make it yours

- **Real catalog:** replace `data/catalog.json` with the supplier's actual SKUs and prices. Matching adapts automatically.
- **Rates:** markup %, labor rate, and tax (US sales tax, UK/EU VAT, etc.) are options in `src/quote.js`.
- **Confidence floor:** `matchItem(..., floor)` in `src/match.js` controls how sure a match must be before it's priced (raise it to flag more, lower it to auto-price more).

Built by Clinton, VNSIS. Parsing runs on `claude-opus-4-8`.
