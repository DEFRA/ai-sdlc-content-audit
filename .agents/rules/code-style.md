# Code Style

## JavaScript Standards

- Write all source files in vanilla JavaScript — no TypeScript. Use JSDoc comments for type annotations.
- Use ES Modules: `export const foo = ...` and `import { foo } from '...'`, not `module.exports` or `require`.
- Use named exports only — not default exports.
- Use the `~` alias for internal project imports: `import { foo } from '~/src/server/common/...'`.

## Extract constants

Never hardcode values inline. Extract all magic strings, numbers, and URLs to named constants.

- Module-level constants at the top of the file, before any function definitions.
- Constants shared across files go in `src/server/common/constants/`.
- Name constants in `SCREAMING_SNAKE_CASE`.

```js
// Bad
if (status === 'published') { ... }

// Good
const STATUS_PUBLISHED = 'published'
if (status === STATUS_PUBLISHED) { ... }
```

## HTTP calls

Use native `fetch` for all API calls.

## Nunjucks templates

Split templates into logical sections using `{% include %}` or `{% block %}`. A template should be readable at a glance — if a section is longer than ~30 lines, extract it.

- Partials live in `src/server/common/templates/partials/`.
- Feature-specific includes live alongside the feature template at `src/server/features/<name>/`.
- Every template that requires data must be backed by its `view-model.js`. The view model is the sole source of data for the template — no logic in the `.njk` file.
- Define all view model properties using JSDoc, with types for every field.

```javascript
/**
 * @param {Object} params
 * @param {string} params.title
 * @param {boolean} params.isActive
 */
export class MyViewModel {
  constructor({ title, isActive }) {
    this.title = title
    this.isActive = isActive
  }
}
```
