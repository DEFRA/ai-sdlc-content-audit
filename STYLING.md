# Defra Visual Styling Rules

> This file defines the visual rules for building Defra digital services. It relies on **GOV.UK Frontend** (`govuk-frontend` npm package) as the base styling system. Do not redefine GOV.UK styles — use the classes directly. Custom Defra components use the `defra-` prefix following GOV.UK BEM conventions.
>
> **Reference:** https://design-system.service.gov.uk/styles/

---

## 1. Foundation: GOV.UK Frontend

All pages must include `govuk-frontend` CSS. Use the rebranded template:

```html
<html class="govuk-template govuk-template--rebranded"></html>
```

### Font

```css
font-family: Helvetica, Arial, sans-serif;
```

This is the only font stack. Do not use GDS Transport. Apply to `body` and inherit everywhere.

---

## 2. Colour Palette

Use GOV.UK colour classes wherever possible. The following are Defra-specific overrides only.

### Defra Brand Colours

| Hex       | Name              | Usage                                                                         |
| --------- | ----------------- | ----------------------------------------------------------------------------- |
| `#008531` | Defra Green       | Nav, hero, footer border, version label, tile hover border, active indicators |
| `#00a33b` | Defra Green Light | Header service name, logo                                                     |
| `#006a27` | Defra Green Dark  | Button hover                                                                  |

### GOV.UK Colours (use as-is, do not redefine)

Refer to https://design-system.service.gov.uk/styles/colour/

| GOV.UK Name                  | Hex       | Role                    |
| ---------------------------- | --------- | ----------------------- |
| `govuk-colour("blue")`       | `#1d70b8` | Links, tile links       |
| `govuk-colour("dark-blue")`  | `#003078` | Link hover              |
| `govuk-colour("black")`      | `#0b0c0c` | Body text, borders      |
| `govuk-colour("dark-grey")`  | `#505a5f` | Secondary text          |
| `govuk-colour("mid-grey")`   | `#b1b4b6` | Borders                 |
| `govuk-colour("light-grey")` | `#f3f2f1` | Backgrounds             |
| `govuk-colour("white")`      | `#ffffff` | Page body, tile default |
| `govuk-colour("yellow")`     | `#fd0`    | Focus states            |
| `govuk-colour("red")`        | `#d4351c` | Errors                  |
| `govuk-colour("green")`      | `#00703c` | Success, GOV.UK buttons |

Page background for rebranded template: `#f4f8fb`.

---

## 3. Typography

Use GOV.UK heading and body classes directly. Do not define custom font sizes.

**Headings:** `govuk-heading-xl`, `govuk-heading-l`, `govuk-heading-m`, `govuk-heading-s`

**Body:** `govuk-body-l`, `govuk-body`, `govuk-body-s`

**Captions:** `govuk-caption-xl`, `govuk-caption-l`, `govuk-caption-m`

**Lists:** `govuk-list`, `govuk-list--bullet`, `govuk-list--number`

**Links:** Use default `govuk-link` behaviour. See https://design-system.service.gov.uk/styles/links/

**Font overrides:** `govuk-!-font-weight-bold`, `govuk-!-font-weight-regular`, `govuk-!-font-size-{size}`

---

## 4. Layout

Use the GOV.UK layout system. See https://design-system.service.gov.uk/styles/layout/

**Container:** `govuk-width-container` (960px max)

**Grid row:** `govuk-grid-row`

**Columns:** `govuk-grid-column-full`, `govuk-grid-column-three-quarters`, `govuk-grid-column-two-thirds`, `govuk-grid-column-one-half`, `govuk-grid-column-one-third`, `govuk-grid-column-one-quarter`

**Main wrapper:** `govuk-main-wrapper`

---

## 5. Spacing

Use GOV.UK spacing override classes. See https://design-system.service.gov.uk/styles/spacing/

**Margin:** `govuk-!-margin-{0-9}`, `govuk-!-margin-top-{0-9}`, etc.

**Padding:** `govuk-!-padding-{0-9}`, `govuk-!-padding-top-{0-9}`, etc.

**Section breaks:** `govuk-section-break`, `govuk-section-break--visible`, `govuk-section-break--l`, `govuk-section-break--m`, `govuk-section-break--xl`

---

## 6. GOV.UK Components Used

Use these directly from `govuk-frontend`. Do not restyle them.

- `govuk-skip-link`
- `govuk-breadcrumbs` / `govuk-breadcrumbs__list` / `govuk-breadcrumbs__link`
- `govuk-button` / `govuk-button--secondary` / `govuk-button--start`
- `govuk-tag`
- `govuk-accordion`
- `govuk-details`
- `govuk-inset-text`
- `govuk-error-summary` / `govuk-error-message`
- `govuk-table` / `govuk-table__header` / `govuk-table__cell`
- `govuk-summary-list`
- `govuk-notification-banner`
- `govuk-tabs`
- `govuk-back-link`

---

## 7. Defra Custom Components

These use the `defra-` prefix and extend beyond GOV.UK Frontend.

### 7.1 Header

```css
.defra-header {
  background-color: #ffffff;
  border-bottom: 1px solid #b1b4b6;
}

.defra-header__inner {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 24px;
  max-width: 960px;
  margin: 0 auto;
  padding: 12px 15px;
  align-items: center;
}

.defra-header__logo {
  height: 60px;
  width: auto;
}

.defra-header__service-name {
  color: #00a33b;
  font-size: 22px;
  font-weight: 700;
  text-decoration: none;
  line-height: 1.2;
}

.defra-header__service-name:link,
.defra-header__service-name:visited {
  color: #00a33b;
}

.defra-header__service-name:hover {
  text-decoration: underline;
  text-decoration-thickness: 3px;
  text-underline-offset: 0.15em;
}
```

Service name colour must stay `#00a33b` in all states (`:link`, `:visited`).

Focus uses the standard GOV.UK yellow focus pattern.

**Mobile (≤768px):** Logo `45px`, service name `18px`.

### 7.2 Service Navigation

```css
.defra-service-navigation {
  background-color: #008531;
  border-bottom: 1px solid #b1b4b6;
}

.defra-service-navigation__inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 15px;
}

.defra-service-navigation__list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.defra-service-navigation__link {
  display: block;
  padding: 12px 16px;
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  text-decoration: none;
  border-bottom: 4px solid transparent;
}

.defra-service-navigation__link:link,
.defra-service-navigation__link:visited {
  color: #ffffff;
}

.defra-service-navigation__link:hover {
  background-color: rgba(0, 0, 0, 0.2);
  box-shadow: inset 0 -4px 0 0 #eefdf4;
}

.defra-service-navigation__link:focus {
  background-color: #fd0;
  color: #0b0c0c;
  outline: 3px solid #fd0;
}

.defra-service-navigation__link[aria-current='page'] {
  background-color: rgba(0, 0, 0, 0.2);
  box-shadow: inset 0 -4px 0 0 #ffffff;
  font-weight: 700;
}
```

Nav links must stay white in all states (`:link`, `:visited`) — the browser's visited purple is invisible on the green background.

Mobile (≤768px): Collapses to toggle button `.defra-service-navigation__toggle`.

### 7.3 Hero Banner

```css
.defra-hero {
  background-color: #008531;
  color: #ffffff;
  padding: 40px 15px;
  width: 100vw;
  position: relative;
  left: 50%;
  transform: translateX(-50%);
}
```

Uses `govuk-heading-xl` and `govuk-body-l` inside — force colour to `#ffffff`.
Layout: `govuk-grid-row` with `govuk-grid-column-two-thirds` + `govuk-grid-column-one-third`.

```css
.defra-hero__whats-new {
  border: 1px solid rgba(255, 255, 255, 0.6);
  padding: 16px 20px;
  color: #ffffff;
  background-color: transparent;
}
```

### 7.4 Version Banner

```css
.defra-version-banner {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  background-color: #f3f2f1;
  border: 1px solid #b1b4b6;
  padding: 15px 20px;
  margin: 20px -15px 32px;
}

.defra-version-banner__label {
  background-color: #008531;
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  padding: 4px 10px;
}

.defra-version-banner__text {
  color: #0b0c0c;
  font-size: 16px;
  line-height: 1.5;
}
```

Links inside use standard `govuk-link` styling.

### 7.5 Tiles — CRITICAL

Displayed in a CSS Grid with equal-height rows. Do not use `govuk-grid-row` / `govuk-grid-column-*` — the grid handles layout.

```css
.defra-tile-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-auto-rows: 1fr;
  gap: 16px;
  list-style: none;
  margin: 16px 0 24px;
  padding: 0;
}

.defra-tile-grid > li {
  display: flex;
}

.defra-tile {
  background-color: #ffffff;
  border: 1px solid #b1b4b6;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 140px;
  padding: 18px 18px 22px;
  position: relative;
  transform: translateY(0);
  transition:
    border-color 0.1s ease-out,
    box-shadow 0.1s ease-out,
    background-color 0.1s ease-out,
    transform 0.1s ease-out;
}

.defra-tile:hover {
  background-color: #f3f2f1;
  border-color: #008531;
  box-shadow: 0 2px 0 #0b0c0c;
  transform: translateY(-1px);
}

.defra-tile:has(.defra-tile__link:focus-visible) {
  background-color: #ffffff;
  border-color: #0b0c0c;
  box-shadow: 0 0 0 1px #0b0c0c;
  outline: 3px solid #fd0;
  outline-offset: 0;
}

.defra-tile__title {
  /* uses govuk-heading-m */
  margin-top: 12px;
  margin-bottom: 8px;
}

.defra-tile__link {
  color: #1d70b8;
  text-decoration: underline;
}

.defra-tile__link::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

.defra-tile__link:visited {
  color: #1d70b8; /* stays blue, never purple */
}

.defra-tile__link:focus,
.defra-tile__link:focus-visible {
  outline: none; /* focus handled by parent tile */
}

.defra-tile__body {
  /* uses govuk-body */
  margin-bottom: 0;
}
```

### 7.6 Sections

```css
.defra-section {
  margin-top: 40px;
}

.defra-section:first-of-type {
  margin-top: 0;
}
```

Use `govuk-section-break govuk-section-break--visible govuk-section-break--l` between sections.

### 7.7 Footer

```css
.defra-footer {
  background-color: #f3f2f1;
  border-top: 10px solid #008531;
  padding: 25px 0;
}
```

Uses `govuk-width-container` inside. Links styled as `defra-footer__link` with `color: #0b0c0c`. Standard GOV.UK focus ring.

### 7.8 Breadcrumbs (Inverse)

Uses `govuk-breadcrumbs` as base, with Defra modifier for dark backgrounds:

```css
.defra-breadcrumbs--inverse .govuk-breadcrumbs__link {
  color: #ffffff !important;
  text-decoration: none;
}

.defra-breadcrumbs--inverse .govuk-breadcrumbs__link:focus {
  background-color: #fd0 !important;
  color: #0b0c0c !important;
}
```

### 7.9 Side Navigation

```css
.defra-subnav__link--current {
  background-color: #f3f2f1;
  border-left: 4px solid #008531;
  display: block;
  padding: 8px 10px;
  margin-left: -14px;
  text-decoration: none;
  color: #0b0c0c;
}
```

All other subnav links use standard `govuk-link` colours and focus states.

### 7.10 Prompt Block

Copyable code block with placeholder highlighting. Used on gallery detail pages.

```css
.defra-prompt-block {
  background-color: #f3f2f1;
  border: 1px solid #b1b4b6;
  padding: 16px;
  position: relative;
  margin-bottom: 24px;
}

.defra-prompt-block pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 16px;
  line-height: 1.5;
}

.defra-prompt-block code {
  font-family: monospace;
}

.defra-prompt-block__copy {
  position: absolute;
  top: 8px;
  right: 8px;
}

.defra-prompt-block__copy--success {
  background-color: #008531;
  border-color: #008531;
  color: #ffffff;
}

.defra-prompt-block__copy--error {
  background-color: #d4351c;
  border-color: #d4351c;
  color: #ffffff;
}

.defra-placeholder {
  background-color: #ffdd00;
  padding: 0 2px;
}
```

The `defra-prompt-block__status` element is visually hidden (`clip-path: inset(50%)`) with `aria-live` for screen reader copy announcements.

---

## 8. Focus States

Follow the GOV.UK focus state pattern everywhere. See https://design-system.service.gov.uk/get-started/focus-states/

```css
background-color: #fd0;
box-shadow:
  0 -2px #fd0,
  0 4px #0b0c0c;
outline: 3px solid transparent;
color: #0b0c0c;
text-decoration: none;
```

Do not modify this pattern.

---

## 9. Responsive Breakpoints

Use GOV.UK Frontend breakpoints:

| Name    | Value                |
| ------- | -------------------- |
| Mobile  | `20rem` (320px)      |
| Tablet  | `40.0625rem` (641px) |
| Desktop | `48.0625rem` (769px) |

Additional Defra breakpoints: `768px` (nav collapse), `480px` (small mobile), `1020px` (container centres).

---

## 10. Rules

1. **Always use GOV.UK Frontend classes** for typography, layout, spacing, and standard components. Do not redefine them.
2. **Use the `defra-` prefix** for all custom components. Never modify `govuk-` classes directly.
3. **No rounded corners.** `border-radius: 0` everywhere.
4. **Tile visited links stay blue** — `#1d70b8`, not `#4c2c92`.
5. **Tiles must have `min-height: 140px`** and the full-coverage `::after` pseudo-element link.
6. **Tile hover must lift** — `transform: translateY(-1px)` with Defra green border.
7. **Navigation is `#008531`** (Defra green), not `#1d70b8` (GOV.UK blue).
8. **Header is white background** with CSS grid — not the standard `govuk-header`.
9. **Footer uses `defra-footer`** with `#008531` top border — not the standard `govuk-footer`.
10. **Focus states must follow the GOV.UK pattern** — yellow background, black text, 3px outline.
