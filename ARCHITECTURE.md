# ARCHITECTURE.md

> This file documents what the project is, what it runs on, how features are structured, and how to run it. Keep it brief. Do not duplicate rules that live in `.agents/rules/` — reference them instead. Add a section here when a complex or non-obvious pattern is established in the codebase.

---

## Project

An AI SDLC content audit frontend — a server-rendered Defra digital service for auditing published guidance against the underlying legislation.

---

## Tech Stack

| Concern             | Choice                                                                   |
| ------------------- | ------------------------------------------------------------------------ |
| Language            | JavaScript (ESM, Node ≥ 24)                                              |
| Server framework    | Hapi.js                                                                  |
| Templating          | Nunjucks                                                                 |
| CSS                 | SCSS compiled via Webpack, GOV.UK Frontend base, Defra custom components |
| Session cache       | Redis (via `@hapi/catbox-redis`) / in-memory for local dev               |
| Package manager     | npm                                                                      |
| Test runner         | Vitest                                                                   |
| Agent orchestration | Markdown skills in `.agents/skills/`                                     |

**Infrastructure dependencies (via Docker Compose):**

- Redis 7 — session caching
- LocalStack — local AWS emulation (S3, SQS, SNS, Firehose)
- MongoDB 6 — available in compose, not yet wired into the app

---

## Feature Architecture

Full directory and naming rules are in `.agents/rules/server-architecture.md`. The short version:

```
src/server/features/<feature-name>/
  index.js        route registration (Hapi plugin)
  index.njk       Nunjucks template
  controller.js   HTTP request/response only
  view-model.js   business logic and service coordination

src/server/services/<service-name>/
  service.js      external API / HTTP calls
  repository.js   data access (Redis etc) — only when needed
```

### controller.js

Reads from the request, calls the view model, renders the view. No business logic. No direct service calls.

### view-model.js

Owns all business logic for the feature. The only layer that talks to services. Transforms and combines data before handing it back to the controller. If a feature has no service calls, the view model still exists and returns the data the template needs — keeping the controller thin and the pattern consistent.

### Dependency flow

```
controller → view-model → service → repository
```

No layer may skip another.

### Nunjucks template search paths

`src/config/nunjucks/nunjucks.js` configures Nunjucks with the following search paths (in addition to `govuk-frontend/dist/`):

- `src/server/common/templates` — shared layouts and partials
- `src/server/common/components` — shared component macros
- `src/server` — enables feature templates to use `{% include "features/<name>/_partial.njk" %}`

The `src/server` entry is intentional. It allows feature templates to be split into partials that live alongside the feature, following the template-splitting rule in `code-style.md`.

---

## Approved Libraries

Use only libraries from this list for each concern. Do not introduce alternatives without a documented reason.

| Concern               | Approved library / approach                                     |
| --------------------- | --------------------------------------------------------------- |
| HTTP server           | `hapi`                                                          |
| Server plugins        | `@hapi/inert`, `@hapi/vision`                                   |
| Session cache         | `@hapi/catbox-redis` (Redis), `@hapi/catbox-memory` (local dev) |
| Validation            | `joi`                                                           |
| Templating            | `nunjucks`                                                      |
| HTTP calls (outbound) | Native `fetch` — no axios, node-fetch, or got                   |
| CSS                   | SCSS via Webpack, `govuk-frontend` as base                      |
| Date formatting       | `date-fns`                                                      |
| Testing               | `vitest`                                                        |
| Agent orchestration   | Markdown skills in `.agents/skills/`                            |

If a library is not listed here, check whether an approved alternative covers the need before adding a new dependency.

---

## Commands

### Run the app with Docker

```bash
docker compose up
```

Starts the frontend (port 3000), Redis, and LocalStack. The app hot-reloads via nodemon.

To build and run just the app container:

```bash
docker compose up ai-sdlc-content-audit
```

---
