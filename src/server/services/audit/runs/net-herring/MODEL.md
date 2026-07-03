# esther — net-herring

## Description

Presentation bundle for the fish, shellfish and fish-derived food and feed products category audit. Same Esther presentation schema as `meadow-verdict`.

Previously lived only in the `ai-sdlc-content-audit-data` repo as a fish-only flat JSON bundle, then was manually concatenated into the main app's `audit/data/` directory alongside slurry.

## Started

2026-06-30 (approx — after `beatrice/verdict-herring` completed)

## Provenance

One Esther run covers one Grace category end-to-end.

- **Category:** fish (`grace/harbour-seal`)
- **Upstream runs:**
  - `grace/harbour-seal` — category title and scope
  - `ada/net-charter` — principal legislation bundle
  - `searchapi/pasture-herring` — Mary metadata corpus (pilot artefact)
  - `radia/sieve-herring` — fish relevance labels (61 pages)
  - `susan/harbour-linnet` — guidance propositions (3,984)
  - `judit/statute-herring` — law propositions (2,219)
  - `beatrice/verdict-herring` — status-annotated guidance ↔ law matches
- **Models used:** Same stack as the upstream fish pilot (Claude Sonnet 4.6 for Susan/Beatrice, Haiku+Sonnet for Radia, frontier extraction for Judit).

## Runtime

Unknown — presentation bundle assembled manually from pipeline outputs.

## Approx cost

Marginal over upstream pipeline cost (~$75 USD combined across the fish chain).

## Notes on settings

- **Output shape:** envelope `output.json`, `schema_version: "1"`, same `presentation` keys as `meadow-verdict`.
- **Source snapshot:** packed from `ai-sdlc-content-audit-data/src/server/services/audit/data/` (fish-only bundle).
- Page analytics and reading-age fields were enriched separately; they are not direct Beatrice outputs.
- Radia consumed a 61k-page sitemap corpus; the registered searchapi run (`pasture-herring`) is the Mary metadata artefact from the same pilot period.
