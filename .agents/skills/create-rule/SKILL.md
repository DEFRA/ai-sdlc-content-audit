# Write Rules File

Create a scoped domain rules file in `.agents/rules/` that governs coding conventions for a specific area of the codebase.

## Metadata

```yaml
triggers:
  - 'create a rules file'
  - 'write a rules file'
  - 'add a rule'
  - 'add coding standards'
  - 'write coding conventions'
  - 'new rules for'
```

## When to Use

Use this skill when asked to create, add, or write a rules file, coding standards, or conventions for a specific domain or area of the codebase.

## Input / Output

**Input:** The domain or area the rules should govern (e.g., "testing", "API design"). If not provided, ask the user before proceeding.
**Output:** A new file at `.agents/rules/<domain-name>.md` following the template in the Output Format section below.

## Persona

You are a coding standards author. You write precise, scoped rule files that tell agents exactly how to write code in a specific domain. You keep rules short, measurable, and free of procedural steps.

## Instructions

### Step 1: Identify the domain

Determine what area or file type the rules govern (e.g., testing, API design, frontend components). If unclear, ask the user to clarify the scope before proceeding.

### Step 2: Choose a name

Name the file with a noun or noun-phrase identifying the domain in kebab-case. The name must answer: "What area does this govern?" Examples: `testing.md`, `api-design.md`, `frontend-components.md`.

### Step 3: Draft the content

Write the file following the Output Format template below. Every line must directly impact how code is written in the domain.

### Step 4: Apply the checklist

Verify every item in the checklist below before writing the file.

### Step 5: Write the file

Create the file at `.agents/rules/<name>.md`.

### Step 6: Update AGENTS.md

Add the new rule to the rules table in `AGENTS.md`.

## Output Format

The rules file must follow this structure:

```markdown
# [Domain Name]

[One sentence: what this rule governs and when it applies.]

## Scope

This applies to [describe the files, directories, or type of work this covers].

## [Section heading]

- [Directive written as a positive, imperative command]
- [Directive written as a positive, imperative command]

## Example

[Short before/after or ✅/❌ snippet for any directive that could be ambiguous]
```

### Content rules

- Write every directive as a positive imperative: "Use X" rather than "Don't use Y".
- Define measurable goals where possible: "Write functions under 20 lines" rather than "Keep functions short".
- State each idea once — repeat no concept across sections.
- Include a code example only where a directive might be ambiguous without one.
- Put step-by-step procedures in a skill, not a rule.
- Put project-wide commands or setup in `AGENTS.md`.

## Checklist

Verify before writing the file:

- [ ] Every directive is a positive imperative command
- [ ] Each directive has measurable or concrete success criteria
- [ ] Ambiguous directives include a short code example
- [ ] No concept is repeated across sections
- [ ] The file uses markdown headings and bullet points for hierarchy
- [ ] The file is self-contained — no external links
- [ ] The file is as short as possible while remaining complete (target: under 200 lines)
