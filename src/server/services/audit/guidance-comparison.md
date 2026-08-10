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

## Aggregated page — release QA notes

There is no screenshot / Storybook / Playwright visual suite in this repo.
Use the live page (or template unit fixtures) for visual capture.

### Representative local URLs

Replace `{pageId}` with a page that has mixed aggregates (e.g. ssafo-nitrates
“Using nitrogen fertilisers…”):

| State                       | URL                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Unfiltered mixed aggregates | `/audit/subjects/{categoryId}/pages/{pageId}`                                                                |
| Conflict only               | `?outcome=conflict_found`                                                                                    |
| Supporting only             | `?outcome=supporting_law_found`                                                                              |
| No confirmed support        | `?outcome=no_confirmed_support`                                                                              |
| Not assessed                | `?outcome=not_assessed`                                                                                      |
| Multiple filters            | `?outcome=conflict_found&outcome=not_assessed`                                                               |
| Filtered empty              | use filters that yield zero matches on a smaller fixture page, or assert via `page-summary.template.test.js` |
| Deep link into a comparison | `#statement-{matchId}` on a filtered or unfiltered URL                                                       |

Template-level fixtures covering mixed conflict/supporting/incomplete,
missing assessment rationale, missing source URL, and not-assessed processing
copy live under `test/unit/server/features/audit-page-detail/`.

### Manual screen-reader script (not yet executed)

Run with VoiceOver (Safari/Chrome) or NVDA (Firefox) on the aggregated page:

1. Navigate by headings — confirm `h1` page title, then summary / filters /
   statements `h2`, guidance `h3`, comparison `h4` (no noisy repeated
   “Legal proposition” / “Assessment” headings).
2. Land on the filter region — form or section named from
   “Filter guidance statements”.
3. Hear each outcome checkbox with count context
   (e.g. “Conflict found, 3 guidance statements”).
4. On a guidance article, hear aggregate outcome as
   “Overall guidance outcome: …”, then composition and explanation.
5. Operate a “Review N law comparison(s)” disclosure — expanded state from
   the native control; label text must not change to “Hide…”.
6. Inside a comparison, hear “Law comparison outcome: …”.
7. Tab to a source link — descriptive text including “(opens in new tab)”.
8. Apply filters that empty the list — hear the filtered-empty copy and a
   working “Clear filters” action.

Record the platform/browser combination when this script is completed.
Do not treat markup unit tests as a substitute for this check.

### Remaining manual pre-release checks

- **400% browser zoom** at a desktop viewport (not only a 320px width probe)
- The screen-reader script above
- No-CSS sanity: one “Review N…” summary string per disclosure; no “Hide…”
- JavaScript disabled: GET filters, checkbox restore, clear filters, native
  details, source links
