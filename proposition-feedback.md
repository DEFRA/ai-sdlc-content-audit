# Feature request: GDS-compliant proposition feedback widget + admin review screen

## Context

The audit page detail view at `GET /audit/subjects/{categoryId}/pages/{pageId}` lists guidance propositions matched against legislation propositions, each tagged with one of six `match_status` values:

| Constant              | Label                    |
| --------------------- | ------------------------ |
| `CONFLICTS`           | Goes against the law     |
| `GUIDANCE_MISSING`    | No guidance for this law |
| `GUIDANCE_INCOMPLETE` | Only part of the law     |
| `UNGROUNDED`          | No law found             |
| `GUIDANCE_BROADER`    | Goes beyond the law      |
| `GROUNDED`            | Matches the law          |

These statuses are reviewer judgements produced upstream. We want a way for human reviewers reading the page to **flag that they disagree** with a given status, optionally suggest a corrected one, and optionally leave a free-text comment. Feedback is captured in Redis and surfaced on a simple, unauthenticated `/admin` screen so the team can review, download, or clear it.

The repo currently uses Redis only as a session cache via `@hapi/catbox-redis`. There are no POST endpoints, no body-parsing validation pattern, and no `/admin` route. This feature introduces all three.

## Goals

- Reviewers can flag disagreement with any rendered proposition's status, optionally proposing a new status and/or leaving a comment.
- Feedback is stored in Redis without being tied to a session — anyone hitting `/admin` sees everything everyone has submitted.
- The widget is a **self-contained, drop-in component** so it can be removed cleanly when the audit becomes read-only again.
- Everything visible to the user is built from GOV.UK Frontend macros and uses plain, neutral language that does not collide with the existing status terminology.

## Non-goals

- No auth, RBAC, or session scoping on either the submission endpoint or `/admin`.
- No edit/delete of individual feedback entries from `/admin` — only bulk clear.
- No analytics, aggregation, or change-tracking — the admin screen is just a scrollable list plus download/clear.
- No migration path off Redis; this is intentionally ephemeral storage.

## UX — proposition feedback widget

Rendered once per proposition row on the audit page detail view, immediately below or alongside the existing status display. The component should be self-contained (one template partial, one controller for its POST, optionally one small stylesheet) so deleting the feature later means removing one folder and one include line.

Default (collapsed) state:

- A single GOV.UK checkbox with a deliberately neutral label such as **"Flag this match for review"**. The label must not reuse any of the six status words (no "match", "law", "guidance", "grounded", etc. as verbs); "Flag this match for review" is suggested but the implementer can pick any equivalent that reads naturally and is distinguishable.
- Helper hint text underneath the checkbox: e.g. **"Tell us if you think the status above is wrong."**

When the checkbox is ticked, the widget reveals (no page reload required — progressive enhancement is fine but a no-JS fallback should still post correctly):

- A **GOV.UK Select** labelled **"Suggested status (optional)"** with options corresponding to the six `match_status` constants. Default option is an empty "— select —" so a blank submission is meaningful. Pull labels from the existing `audit/constants.js` so the wording stays in sync.
- A **GOV.UK Character-count Textarea** labelled **"Comment (optional)"**, with a sensible cap (suggest 1000 chars).
- A **GOV.UK Button** labelled **"Submit review"**. The button should only appear once the checkbox is ticked (matches the brief). It submits via POST; either input being blank is allowed — the disagreement flag itself is the minimum payload.

Both optional fields must use the standard GOV.UK "(optional)" suffix on their labels and have no `required` attribute.

After successful POST, the widget should collapse back to its default state and show a small confirmation (GOV.UK notification banner or inline success message). A reviewer can submit again on the same proposition — each submission is a new entry, not an update.

## Backend — endpoint

Add one POST route under the existing audit-page-detail URL space, e.g.:

```
POST /audit/subjects/{categoryId}/pages/{pageId}/propositions/{propositionMatchId}/feedback
```

The route key uses `proposition-matches.id` (the integer row ID from `proposition-matches.json`) because that uniquely identifies the `(guidance_proposition, legislation_proposition, match_status)` triple shown on screen.

Payload (form-encoded, since the form is GDS-rendered and we want the no-JS path to work):

- `suggested_status` — empty string or one of the six constants
- `comment` — empty string or free text (server-side trimmed, length-capped)

Server-side validation (suggested library: Joi, since it's the Hapi-native choice and the repo doesn't yet have one wired):

- Reject if `suggested_status` is non-empty and not one of the six known constants.
- Cap `comment` length.
- 303 redirect back to the originating page detail URL with a flash-style success signal (a query param is fine given there's no flash plugin yet — keep it simple).

## Redis data model

This is the part worth being deliberate about. Three considerations:

1. **The records aren't keyed by session, and the admin needs to list/download them all.** So we need a stable enumeration mechanism — you cannot `KEYS *` in production-grade code.
2. **Duplicates need to be identifiable.** The brief specifies a unique ID _and_ a Unix timestamp on every entry.
3. **Existing `keyPrefix` convention** (set in `redis-client.js` via `redisConfig.keyPrefix`) namespaces everything per service — feedback keys should sit under a clearly-named sub-prefix, e.g. `feedback:` — so the catbox session keys and feedback keys cannot collide and a future Redis clear scoped to feedback is trivial.

**Recommended structure:**

- One **Redis List** at key `feedback:entries` storing JSON-serialised feedback objects, appended via `RPUSH`. Lists give us cheap append, cheap full-read (`LRANGE 0 -1`), cheap length, and cheap atomic clear (`DEL`). Order of insertion is preserved, which is what the admin view wants.

- Each list element is a JSON string of an object containing roughly:
  - `id` — a UUID (v4) generated server-side at write time. This is what disambiguates duplicates.
  - `submitted_at` — Unix epoch seconds (integer).
  - `category_id`, `page_id`, `proposition_match_id` — the URL path parameters, so the entry is self-describing without needing a join.
  - `current_status` — the `match_status` constant the proposition had at submission time, captured server-side from the audit service (not trusted from the client). Useful because the upstream data may change.
  - `suggested_status` — the constant the user picked, or null.
  - `comment` — the trimmed comment, or null.

- _Optional_ secondary index: if listing feedback "for proposition X" ever becomes useful, also `RPUSH` the `id` into `feedback:by-proposition:{proposition_match_id}`. Not required for this feature — flag as a possible follow-up.

**Why a List rather than a Hash or sorted set:**

- A Hash keyed by ID would require either tracking IDs separately (extra book-keeping) or `HKEYS`/`SCAN` to enumerate, which we want to avoid.
- A Sorted Set keyed by timestamp would re-order ties unpredictably and add no value here.
- A List is the simplest thing that supports append, ordered read, length, and delete.

A small wrapper module under `src/server/services/feedback/` (mirroring the `services/audit/` shape — `service.js`, plus the Redis client passed in via DI) keeps the Redis access in one place so it can be unit-tested with a fake client.

## Admin screen

New feature folder, e.g. `src/server/features/admin-feedback/`. Two routes:

- `GET /admin` — renders an `index.njk` showing every feedback entry in submission order. Each row should show the timestamp (formatted), the link back to the originating `/audit/subjects/.../pages/.../#proposition-{id}` anchor, the current status, the suggested status (if any), and the comment (if any). Use GOV.UK Summary List or a plain table. Above the list, two GOV.UK buttons:
  - **"Download all feedback"** (links to `GET /admin/feedback.json`)
  - **"Clear all feedback"** (POSTs to `POST /admin/clear` and shows a GOV.UK warning/confirm pattern before doing so)

- `GET /admin/feedback.json` — streams the full list as a JSON array download (`Content-Disposition: attachment`).

- `POST /admin/clear` — `DEL feedback:entries` (and any secondary index keys), redirects back to `/admin` with a success banner.

The admin screen is intentionally unauthenticated, matching the brief. Add a short note on the page itself that it is an internal review surface and not for public sharing — this is the cheapest possible mitigation without introducing auth.

## File layout (suggested)

```
src/server/features/proposition-feedback/    # the widget + POST handler
  index.js
  controller.js
  view-model.js          # optional - mostly server-side status enum mapping
  index.njk              # the widget partial, included from audit-page-detail/index.njk

src/server/features/admin-feedback/          # the admin screen
  index.js
  controller.js
  view-model.js
  index.njk

src/server/services/feedback/                # Redis wrapper
  constants.js           # key names: 'feedback:entries' etc.
  service.js             # append(), listAll(), clear()
```

Touchpoints in existing code:

- `src/server/router.js` — register the two new feature plugins.
- `src/server/features/audit-page-detail/index.njk` — include the widget partial inside the per-proposition loop, passing the proposition match ID and current status.
- `src/server/server.js` — wire the Redis client into the new feedback service (the client already exists; just make it available to the service the same way catbox uses it).

## Open decisions for the implementer

These are things I deliberately have not pinned down so the coding agent can choose sensibly:

- Whether the POST endpoint uses Joi or a hand-rolled validator (Joi is the Hapi-native choice; first POST in the repo, so it sets the precedent).
- Exact label wording on the checkbox and helper text — anything that is GDS plain English and avoids the six status verbs will do.
- Whether the widget collapses optimistically on submit with a small JS enhancement or relies entirely on the redirect-after-POST round trip. Both are fine; the no-JS path must work either way.
- Whether `submitted_at` is stored as seconds or milliseconds (brief says "Unix style"; seconds is conventional, but consistency with `Date.now()` elsewhere in the repo may matter).
- Confirmation pattern for "Clear all feedback" — a separate `/admin/clear` confirm page vs. an inline `confirm()` is a judgement call.

## Acceptance criteria

- The checkbox appears beside every proposition on `/audit/subjects/{id}/pages/{id}`.
- Ticking it reveals the suggested-status select, comment field, and submit button. All three are absent before ticking.
- Submitting with any combination of optional fields (including both empty) results in exactly one new entry in Redis with a unique `id` and a `submitted_at` timestamp.
- `/admin` lists every entry submitted so far, newest visible without filtering, with no auth challenge.
- "Download all feedback" returns the full list as a JSON file.
- "Clear all feedback" empties the Redis list and the admin screen subsequently shows zero entries.
- Removing the two `features/*-feedback/` folders, the `services/feedback/` folder, the router lines, and the one widget include in `audit-page-detail/index.njk` fully removes the feature with no dangling references.
