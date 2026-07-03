# esther — meadow-verdict

## Description

Presentation bundle for the slurry category audit — the run that originally drove the content-audit frontend. Produced by flattening Beatrice's status-annotated matches (plus upstream law, guidance, page metadata and derived summaries) into the Esther presentation schema consumed by `ai-sdlc-content-audit`.

This is the first Esther run registered in data-assets. It replaces the ad-hoc flat JSON files that previously lived only inside the app repo.

## Started

2026-06-02 (aligned with `beatrice/verdict-otter`)

## Provenance

One Esther run covers one Grace category end-to-end.

- **Category:** slurry (`grace/meadow-thistle`)
- **Upstream runs:**
  - `grace/meadow-thistle` — category title and scope
  - `searchapi/sieve-furrow` — Defra GOV.UK page corpus (cosine scores)
  - `radia/clover-vole` — boolean slurry relevance labels
  - `susan/hedgerow-finch` — guidance propositions
  - `judit/statute-badger` — law propositions
  - `beatrice/verdict-otter` — status-annotated guidance ↔ law matches
- **Models used:** Same stack as `beatrice/verdict-otter` (Claude Sonnet 4.6 for extraction/classification, all-MiniLM-L6-v2 embeddings).

## Runtime

Unknown — presentation bundle was assembled manually from pipeline outputs rather than by an automated Esther exporter.

## Approx cost

Marginal over upstream pipeline cost — no additional model calls for this packaging step.

## Notes on settings

- **Output shape:** envelope `output.json` with `schema_version: "1"` and a `presentation` object containing the ten flat JSON arrays the frontend expects (`categories`, `legislation`, `legislation_propositions`, `pages`, `guidance_propositions`, `proposition_matches`, `page_analytics`, `subject_summary`, `page_relevance`, `pages_reading_age`).
- **Source snapshot:** packed from `ai-sdlc-content-audit` commit `137006d` (slurry-only `audit/data/` before the fish merge).
- Page analytics and reading-age fields were enriched separately; they are not direct Beatrice outputs.
