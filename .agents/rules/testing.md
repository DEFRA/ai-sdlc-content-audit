# Testing

## Core Principles

- **Test behaviour, not implementation.** Verify what the system does, not how it does it.
- **Tests as documentation.** A new developer should understand expected behaviour by reading the tests alone.
- **Confidence over coverage.** Tests should enable safe refactoring — not hit arbitrary percentages.

## Directory structure

Place all tests in `test/`, mirroring the structure of `src/`.

```
test/
  unit/        mirrors src/ — one dependency mocked per test
  integration/ one file per feature — server started, only external deps mocked
```

## Test names

Write names as natural-language sentences that confirm what happens:

- Happy path: `fetches account details and returns customer`, `GET /health returns success`
- Unhappy path: `throws error when account lookup fails`, `returns 404 when resource not found`

Never: `renders correctly`, `should return 200`, `homeController works`.

## One test per flow

All assertions for a single happy-path flow belong in one test. Do not split a single user journey across multiple tests.

## Assert on dynamic values only

Assert on values that change based on data — response status, objects passed to the view, redirects, error messages. Never assert on static content (headings, labels, copy that never changes).

## Test data

- Define all test data as named constants at the top of the file, before any `describe` block.
- For complex shapes or data used in more than one file, create a factory in `src/server/common/test-helpers/<thing>.factory.js`:

```js
export const buildAccount = (overrides = {}) => ({
  id: 'acc-123',
  name: 'Test Customer',
  status: 'active',
  ...overrides
})
```

## One assertion per outcome

Write one `expect` per distinct outcome.

## Test isolation

- Write tests that are independent and runnable in any order without affecting other tests.
- Mock all external dependencies (databases, APIs, file systems) in unit tests.
- Use `beforeEach`/`afterEach` to reset state between tests.

## Parameterised tests

Consolidate tests that verify the same behaviour with minor input variations into parameterised tests rather than separate tests.

## Group validation failures

For endpoints that validate multiple fields or field values, write one parametrised test covering a representative sample — not one test per invalid input. The goal is to show the implementation understands the category of failure, not to enumerate every possible bad value.

## Decision framework

When in doubt: would a new developer understand the system's expected behaviour by reading this test?
