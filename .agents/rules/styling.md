# Styling

Full visual reference is in `STYLING.md`. This file contains the rules agents must follow.

## Principles

- Use GOV.UK Frontend classes for all typography, layout, spacing, and standard components — treat them as read-only.
- Use the `defra-` prefix for all custom component classes.
- Override `govuk-` styles via specificity or wrapper elements — treat `govuk-` class definitions as read-only.
- Set `border-radius: 0` on all custom components.
- Match the GOV.UK yellow focus pattern exactly on all interactive elements.

## Styling Priority

Follow this order before writing any new styles:

1. **Reuse an existing `defra-` or `govuk-` class** — always check first. Prefer consistency over a perfect design match.
2. **Use a GOV.UK Design System utility** — search `node_modules/govuk-frontend` for applicable components and utilities.
3. **Create a new `defra-` component** — only as a last resort, and only with explicit user approval.

- Reuse existing style rules — creating duplicates is never acceptable.
- Extract all hardcoded values (colours, dimensions) as SCSS variables before use.

## SCSS structure

| Path                                                   | Purpose                      |
| ------------------------------------------------------ | ---------------------------- |
| `src/client/stylesheets/variables/_colours.scss`       | Defra brand colour variables |
| `src/client/stylesheets/components/_defra-<name>.scss` | One file per Defra component |
| `src/client/stylesheets/components/_index.scss`        | Imports all component files  |

To add a new component: create `_defra-<name>.scss`, add `@use "defra-<name>";` to `_index.scss`.

Use `$defra-green` (`#008531`), `$defra-green-light` (`#00a33b`), `$defra-green-dark` (`#006a27`) from `variables/colours`.

## Defra components

| Component                    | File                             |
| ---------------------------- | -------------------------------- |
| `defra-header`               | `_defra-header.scss`             |
| `defra-service-navigation`   | `_defra-service-navigation.scss` |
| `defra-hero`                 | `_defra-hero.scss`               |
| `defra-version-banner`       | `_defra-version-banner.scss`     |
| `defra-tile`                 | `_defra-tile.scss`               |
| `defra-section`              | `_defra-section.scss`            |
| `defra-footer`               | `_defra-footer.scss`             |
| `defra-breadcrumbs--inverse` | `_defra-breadcrumbs.scss`        |
| `defra-subnav__link`         | `_defra-subnav.scss`             |
