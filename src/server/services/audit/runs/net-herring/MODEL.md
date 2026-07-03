# esther — net-herring

## Description

Presentation bundle for the fish, shellfish and fish-derived food and feed products category audit. Same Esther presentation schema as `meadow-verdict`, but for the fish pipeline chain.

Previously lived only in the `ai-sdlc-content-audit-data` repo as a fish-only flat JSON bundle, then was manually concatenated into the main app’s `audit/data/` directory alongside slurry.

## Started

2026-06-30 (approx — date of the fish-only data bundle)

## Provenance

- **Category:** fish
- **Upstream runs:** not yet registered in data-assets — placeholders below until the fish-side Grace → Beatrice chain is committed to their respective steps.
  - `grace/unknown`
  - `searchapi/unknown`
  - `radia/unknown`
  - `susan/unknown`
  - `judit/unknown`
  - `beatrice/unknown`
- **Models used:** Unknown — to backfill when upstream runs land in data-assets.

## Runtime

Unknown — presentation bundle assembled manually.

## Approx cost

Unknown — to backfill.

## Notes on settings

- **Output shape:** envelope `output.json`, `schema_version: "1"`, same `presentation` keys as `meadow-verdict`.
- **Source snapshot:** packed from `ai-sdlc-content-audit-data/src/server/services/audit/data/` (fish-only bundle).
- **Open task:** replace `unknown` provenance entries with real run IDs once the fish pipeline outputs are committed under `steps/grace/runs/`, `steps/judit/runs/`, etc.
