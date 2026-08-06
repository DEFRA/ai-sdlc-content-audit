# Guidance–law comparison presentation contract

Frontend data-loading for Audit Assembler outputs that separate **pair-level**
comparisons from **proposition-level** assessment/coverage.

## Assembled inputs

| File                                        | Presentation key                       | Role                                                         |
| ------------------------------------------- | -------------------------------------- | ------------------------------------------------------------ |
| `guidance-proposition-law-comparisons.json` | `guidance_proposition_law_comparisons` | All distinct **reportable** guidance–law pairs for rendering |
| `guidance-proposition-match-summaries.json` | `guidance_proposition_match_summaries` | One assessment/coverage summary per guidance proposition     |
| `proposition-matches.json`                  | `proposition_matches`                  | **Legacy compatibility** only                                |

These two new files are optional on older runs (empty arrays). Rebuild Audit
Assembler output to populate them.

## Separation rules

1. **Pair-level comparisons** come only from
   `guidance-proposition-law-comparisons.json`.
   They never include `UNGROUNDED` (evaluated-but-rejected candidates remain in
   Matcher `results.json` only).
2. **Proposition-level processing and fallback state** come only from
   `guidance-proposition-match-summaries.json`
   (`assessment_status`, `coverage_result` → `fallbackKind` on the view-model).
3. **Guidance-side top-match rows** in `proposition-matches.json` are a
   compatibility projection of data already in the full-pair file.
   Do **not** append them to a guidance proposition’s `comparisons[]` — that
   would duplicate the top pair.
4. **Synthetic `GUIDANCE_MISSING` rows** in `proposition-matches.json`
   (`guidance_proposition_id: null`) are a **law-side** coverage-gap concept.
   They are exposed via `getLawSideMissingGuidance()` / existing
   `missingLaws` paths. They are not guidance fallbacks and must not appear in
   guidance `comparisons[]`.
5. **Missing pair rows alone do not prove that no candidate was found.**
   Only `COMPLETE` + `NO_CANDIDATES_FOUND` (or `ONLY_UNGROUNDED_CANDIDATES`)
   on the summary is conclusive. Empty `comparisons[]` with `NOT_CHECKED` /
   `PARTIAL` / `FAILED` must not be treated as “No Law Candidate”.

## View-model

`buildGuidanceComparisonViewModels(presentation)` (also
`auditService.getGuidanceComparisons()`) returns one
`GuidanceComparisonViewModel` per guidance proposition:

- `comparisons[]` — joined reportable pairs (backend order)
- `fallbackKind` — `NONE` | `NO_CANDIDATES_FOUND` | `ONLY_UNGROUNDED_CANDIDATES` |
  `NOT_CHECKED` | `PARTIAL` | `FAILED` | `INCONSISTENT_DATA`
- `diagnostics[]` — developer-facing invariant failures

Inconsistent assembled data marks that proposition `INCONSISTENT_DATA` rather
than fabricating a legally meaningful fallback. The page still loads.

## Page detail

`getPageDetail()` / `getPageGuidanceRows()` / overview choose the new contract
**per category**: when that category has at least one match-summary row,
guidance-side rows come from `getGuidanceComparisons()`. Sibling categories
without summaries keep the legacy top-match projection so merged run envelopes
do not mark older runs `INCONSISTENT_DATA`.

### Default: aggregated by guidance proposition

`GET /audit/subjects/{categoryId}/pages/{pageId}` lists **one row per guidance
proposition** (`getPageGuidanceRows()` / `buildPageDetailGuidanceRows()`):

- Primary status = worst pair severity, or the proposition-level `fallbackKind`.
- Multi-pair rows show relationship chips and nest pair cards in `govuk-details`.
- Single-pair rows show the pair card open (no details).
- Fallback rows show the processing / coverage meaning only.
- Filter bar counts are **distinct guidance propositions** (same unit as
  overview). A multi-relationship GP belongs once to each matching filter.
- Under a status filter, all pairs remain visible; non-matching pairs are
  dimmed (`Not in this filter`).

### Forensic: flat by match

`GET /audit/subjects/{categoryId}/pages/{pageId}/pairs` keeps the previous flat
list (one card per reportable pair or fallback).

- Pair rows repeat guidance text per hit.
- Fallback rows use `FALLBACK_STATUS_META` labels; feedback is disabled on them.
- Feedback on pair rows uses the comparison `id` (`m-…`); `getMatchStatus`
  resolves both legacy top-match and full-comparison IDs. Deep links to
  `#statement-{id}` on the aggregated page open the ancestor details element.
- Law-side synthetic `GUIDANCE_MISSING` remains on `missingLaws` only.

`GUIDANCE_BROADER` keeps the existing STATUS_META label **Goes beyond the law**
(matcher meaning: guidance adds requirements / a higher bar without
contradicting the law — not “Matches the law”).

## Overview and pages-list

When summaries exist, `getSubjectOverview()` / `statusForPage()` use
`buildGuidanceOverviewModel()` from `getGuidanceComparisons()`. Legacy runs
without summaries keep `proposition_matches` / `NO_MATCH` / Map-of-one.

| Surface                                | Unit                                                             |
| -------------------------------------- | ---------------------------------------------------------------- |
| Page-detail (default)                  | Distinct guidance propositions (nested pair cards)               |
| Page-detail `/pairs`                   | Comparison-pair rows (+ one fallback row per incomplete GP)      |
| Overview relationship / fallback tiles | Distinct guidance propositions                                   |
| Overview “across N pages”              | Distinct pages                                                   |
| Total guidance propositions            | Distinct guidance proposition IDs (do not sum overlapping tiles) |
| Law-side “No guidance for this law”    | Synthetic `GUIDANCE_MISSING` rows / distinct law instruments     |

Multi-relationship: one GP with `GROUNDED` + `CONFLICTS` belongs once to each
relationship filter. Fallback states are mutually exclusive and only when
`fallbackKind !== NONE`. Processing states are not legal conclusions.

`UNGROUNDED` is not an overview category; completed all-rejected appears as
**No comparable law found**. Re-run Audit Assembler to populate the new files
on historic runs.
