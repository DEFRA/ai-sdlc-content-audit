# esther — harbour-perch

## Description

Presentation bundle for the fish, shellfish and fish-derived food and feed products category audit. Same Esther presentation schema as `meadow-verdict`.

Built with the Esther CLI pointing at **Anna's** fish output (Beatrice-schema compatible), not Beatrice directly:

```bash
esther build --beatrice-run content-audit-data-assets/steps/anna/runs/fish ...
```

Anna re-adjudicated 20 of Beatrice `verdict-gull`'s flagged findings before Esther flattened the matches into the frontend bundle.

## Started

2026-06-30 (after `anna/fish` completed)

## Provenance

One Esther run covers one Grace category end-to-end.

- **Category:** fish (`grace/harbour-seal`)
- **Direct Esther input (`--beatrice-run`):** `anna/fish`
- **Full upstream chain:**
  - `grace/harbour-seal` — category title and scope
  - `ada/net-charter` — principal legislation bundle
  - `searchapi/trawl-gill` — Mary metadata corpus (pilot artefact)
  - `radia/shoal-curlew` — fish relevance labels (61 pages)
  - `susan/harbour-linnet` — guidance propositions (3,984)
  - `judit/weir-cod` — law propositions (2,219)
  - `beatrice/verdict-gull` — initial status-annotated matches
  - `anna/fish` — re-adjudication of 56 flagged findings (20 changed)

## Runtime

Esther `build` command — to backfill wall-clock.

## Approx cost

Marginal over upstream pipeline cost (~$75 USD combined across the fish chain, including Anna's ~$0.16).

## Notes on settings

- **Output shape:** envelope `output.json`, `schema_version: "1"`, same `presentation` keys as `meadow-verdict`.
- **Source snapshot:** packed from `ai-sdlc-content-audit-data/src/server/services/audit/data/` (fish-only bundle).
- Page analytics and reading-age fields were enriched separately by Esther's build step.
- Radia consumed a 61k-page sitemap corpus; the registered searchapi run (`trawl-gill`) is the Mary metadata artefact from the same pilot period.
