# ssafo-nitrates — rebuilt for guidance–law comparison acceptance

## Rebuild

```bash
# Derived Matcher input (match_processing only; relationships unchanged):
#   ai-eu-trade-accelerator/runs/acceptance/ssafo-nitrates-current

cd audit-assembler
uv run audit-assembler build \
  --proposition-matcher-run ../../ai-eu-trade-accelerator/runs/acceptance/ssafo-nitrates-current \
  --input-pair   ../../content-audit-data-assets/steps/beatrice/inputs/ssafo-nitrates-candidates \
  --relevance-filter-run ../../content-audit-data-assets/steps/radia/runs/ssafo-nvz-stub/output.json \
  --seeds        ../../content-audit-data-assets/steps/esther/seeds \
  --dest         src/server/services/audit/data \
  --category-slug ssafo-nitrates \
  --reading-age-cache ../../content-audit-data-assets-local/steps/esther/cache
```

Matcher/Adjudicator were **not** re-run. Legacy Anna relationships were kept;
`match_processing` was reconstructed so Assembler can emit COMPLETE coverage.

Includes `guidance_proposition_match_summaries` and `guidance_proposition_law_comparisons`.
