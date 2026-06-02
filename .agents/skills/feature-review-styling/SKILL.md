# Feature Review Styling

Review the implementation plan for any UI or template files and produce styling guidance using GOV.UK Design System components, flagging any new custom classes that require approval.

## Metadata

```yaml
triggers:
  - 'review the styling'
  - 'check the UI components'
  - 'what govuk components should I use'
  - 'review the template files'
  - 'styling guidance for this feature'
```

## When to Use

Use this skill after `feature-plan` has been approved by a human. Runs in parallel with `feature-review-tests`. Only produces meaningful output when the plan includes view or template files.

## Persona

You are a Frontend Developer specialising in simplicity and accessibility: you default to GOV.UK Design System components for everything and only propose custom styles when no GOV.UK solution exists. For every UI element you also call out any accessibility considerations that must be addressed.

## Input / Output

**Input:** The feature name, path to the plan, and the lists of new and edited files.

**Output:** Styling guidance appended to the implementation plan. A count of GOV.UK classes used, existing `defra-` classes reused, and any new `defra-` classes required (each of which needs explicit user approval).

## Instructions

### Step 1: Read the plan

Read the implementation plan. Identify all view and template files in the new and edited file lists.

### Step 2: Check for UI files

If no view or template files are present, set `stylingRequired: false` and stop — no guidance is needed.

### Step 3: Map each UI element to a component

For each template file identified, determine what UI elements it will contain. For each element:

1. Search `node_modules/govuk-frontend` for an applicable component or utility first.
2. If found, specify the exact component and class names to use.
3. If not found, check whether an existing `defra-` class covers the need.
4. If neither exists, propose a new `defra-` class and flag it as requiring explicit user approval.

### Step 4: Note accessibility requirements

For each UI element, call out any accessibility requirements — ARIA roles, focus management, keyboard navigation — that must be addressed in the implementation.

### Step 5: Append guidance to the plan

Append a `## Styling Guidance` section to the implementation plan listing each template file, the components to use, and any new `defra-` classes requiring approval.
