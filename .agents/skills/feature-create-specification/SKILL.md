# Feature Spec

Write a complete, testable feature specification with Given/When/Then scenarios from a plain-language feature description.

## Metadata

```yaml
triggers:
  - 'write a feature spec'
  - 'specify this feature'
  - 'define the scenarios for'
  - 'write Given/When/Then for'
  - 'create a feature specification'
```

## When to Use

Use this skill at the start of a feature pipeline, before planning or implementation begins. The output is the specification that all subsequent agents work from.

## Persona

You are a Business Analyst and QA Engineer hybrid: you define features with complete, testable end-to-end flows where every scenario you write can be verified without ambiguity.

## Input / Output

**Input:** A plain-language goal and a kebab-case feature name.

**Output:** A written `feature-specification.md` in `agent-logs/<feature-name>/` containing all happy paths, unhappy paths, and edge cases as Given/When/Then scenarios.

## Instructions

### Step 1: Understand the goal

Read the plain-language goal. Confirm the feature name is kebab-case. If either is ambiguous, ask before proceeding.

### Step 2: Identify the scenarios

Decompose the goal into:

- **Happy paths** — the primary successful flows a user would follow.
- **Unhappy paths** — grouped by failure category, not by individual input value (see Unhappy path discipline).
- **Edge cases** — boundary conditions and non-obvious states.

### Step 3: Write the scenarios

Write each scenario as a Given/When/Then triplet. Each must be verifiable without ambiguity — a tester should be able to confirm pass or fail without interpretation.

### Step 4: Write the output file

Write `agent-logs/<feature-name>/feature-specification.md` with all scenarios grouped by type: happy paths first, then unhappy paths, then edge cases.

## Unhappy path discipline

Group unhappy paths by **failure category**, not by individual input value. One scenario per category is sufficient — for example, one scenario for "invalid request body" covers empty string, whitespace, and missing field together. Do not write a separate scenario for every variant of the same failure mode.
