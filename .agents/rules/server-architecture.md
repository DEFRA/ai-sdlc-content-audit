# Server Architecture Rules

> Feature architecture rationale and examples live in `ARCHITECTURE.md`. This file contains the rules agents must follow.

## Feature Directory Structure

Every feature lives at `src/server/features/<feature-name>/` and contains exactly these files:

| File            | Purpose                                            |
| --------------- | -------------------------------------------------- |
| `index.js`      | Hapi plugin — route registration only              |
| `index.njk`     | Nunjucks template                                  |
| `controller.js` | HTTP request/response — delegates to view model    |
| `view-model.js` | Business logic and downstream service coordination |

## Service Directory Structure

All calls to external systems live at `src/server/services/<service-name>/`:

| File            | Purpose                                               |
| --------------- | ----------------------------------------------------- |
| `service.js`    | Calls to external APIs, HTTP clients, integrations    |
| `repository.js` | Data access layer (Redis, SQL) — add only when needed |

`repository.js` is optional. Add it only when the service performs persistent storage operations. Most services will not need it.

## Dependency Flow

```
controller → view-model → service → repository
```

Pass all calls through the layer chain in order: controller → view-model → service → repository.

## Framework

- Use Hapi.js exclusively — do not use Express or any other HTTP framework.

## Controller Patterns

- Export controllers as named functions.
- Wrap every handler body in try/catch; log errors with `request.logger`; return a user-friendly error response.
- Delegate all business logic to the view model — controllers handle only HTTP request/response concerns.

```javascript
// ✅ Good
export async function myController(request, h) {
  try {
    const viewModel = await myViewModel(request.params)
    return h.view('my-feature/index', viewModel)
  } catch (error) {
    request.logger.error({ err: error }, 'myController failed')
    return h.view('error').code(500)
  }
}
```

## Directory Philosophy

- **Intention-revealing names**: a reader should know what a directory contains from its name alone.
- **Group similar things together**: features under `features/`, services under `services/`, shared utilities under `common/`.
- **Flat over nested by default**: only add a subdirectory when you have multiple cohesive files to group.
- **Consistency is the priority**: match existing patterns unless you have a specific, documented reason not to.

## Naming Conventions

| Thing             | Convention                |
| ----------------- | ------------------------- |
| Directories       | `kebab-case`              |
| Files             | `kebab-case.js`           |
| Controller export | `<featureName>Controller` |
| View model export | `<featureName>ViewModel`  |
| Service export    | `<serviceName>Service`    |
| Repository export | `<serviceName>Repository` |
