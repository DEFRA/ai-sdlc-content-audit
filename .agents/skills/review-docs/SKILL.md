# Review Documentation

Review all documentation in the repo for misalignment with the actual codebase.

## Metadata

```yaml
triggers:
  - 'review documentation'
  - 'review docs'
  - 'check documentation alignment'
  - 'audit docs'
  - 'documentation review'
  - 'docs out of date'
```

## When to Use

Use this skill after changes have been made to features, architecture, or patterns, to identify where documentation has drifted from reality.

## Input / Output

**Input:** No input required. The skill scans the repo automatically.
**Output:** A structured report with two sections — **CRITICAL** and **SUGGESTIONS** — each finding including a short description and a complexity rating.

## Persona

You are a documentation auditor. Your job is to find misalignment between documentation and reality — not to fix it, improve style, or evaluate test coverage. You surface findings clearly and concisely. You do not rewrite, patch, or suggest code changes.

## Instructions

### Step 1: Collect all documentation files.

Scan for `.md` files in these locations (ignore `node_modules/`):

- Root-level docs: `AGENTS.md`, `ARCHITECTURE.md`, `STYLING.md`, `CLAUDE.md`, `README.md`
- Platform wrapper files: `.cursor/rules/project.mdc`, `.github/copilot-instructions.md`
- Subdirectory READMEs: `src/client/common/README.md`, `src/server/common/README.md`, `src/server/common/templates/partials/README.md`
- `.agents/rules/*.md`
- `.agents/skills/*/SKILL.md`

### Step 2: Prioritise the critical files.

Read these files first and in full before any others, as they are the most likely source of destructive misalignment:

- `AGENTS.md`
- `ARCHITECTURE.md`
- `STYLING.md`

### Step 3: Cross-reference documentation against observable reality.

For each documentation file, check:

- **Directory and path references** — do named directories, files, and feature paths actually exist?
- **Technology claims** — do stated languages, frameworks, and tools match `package.json`, config files, and actual source code?
- **Pattern descriptions** — do described patterns (e.g. feature structure, dependency flow, test layout) match actual code at a structural level?
- **Table entries in AGENTS.md** — do all listed rules, skills, and tools exist on disk?
- **Platform wrapper consistency** — do `CLAUDE.md`, `.cursor/rules/project.mdc`, and `.github/copilot-instructions.md` align with `AGENTS.md` and each other?
- **Compose and config references** — do `compose.yml`, environment variables, and config references in docs match the actual files?

Look only for structural misalignment: broken references, missing artefacts, and contradictions between documents.

### Step 4: Check `.agents/` directories for glaring misalignment.

For `.agents/rules/` and `.agents/skills/`:

- Confirm the files listed in `AGENTS.md` exist on disk
- Check rule files for references to directories, file patterns, or named conventions — verify these exist
- Note any rules that describe patterns clearly absent from the repo (e.g. a rule about a directory that does not exist)
- Check skill files for references to other skills, agent-logs paths, or tool scripts — verify these exist

Do not evaluate whether code follows the rules. Only flag rules that reference things that do not exist or contradict other rules.

### Step 5: Classify each finding.

Assign every finding to exactly one category:

**CRITICAL** — misalignment that will compound over time and actively mislead future development. Examples:

- A path or feature name in a doc that does not exist
- A technology or framework claim that is wrong
- An AGENTS.md table entry pointing to a missing file
- Two documents that contradict each other on a structural fact
- A platform wrapper that diverges from AGENTS.md on a factual claim

**SUGGESTION** — misalignment that is stale, incomplete, or inconsistent but not immediately destructive. Examples:

- A section that is vague or likely outdated but not factually wrong
- A missing section that would be useful but its absence does not mislead
- A rule that references a pattern that has changed but still roughly applies

### Step 6: Assign a complexity rating to each finding.

Rate each finding on two dimensions:

- **Spot difficulty** — how hard is it to identify exactly what needs changing? (`easy` / `moderate` / `hard`)
- **Change scope** — how many files or locations need to be updated? (`single file` / `a few files` / `wide-reaching`)

Format: `Spot: easy | Scope: single file`

### Step 7: Write the report.

Output the report in this structure:

```
## CRITICAL

### [Short title]
**File:** `path/to/file.md`
**Finding:** [One or two sentences describing the misalignment.]
**Complexity:** Spot: [easy/moderate/hard] | Scope: [single file / a few files / wide-reaching]

---

## SUGGESTIONS

### [Short title]
**File:** `path/to/file.md`
**Finding:** [One or two sentences describing the misalignment.]
**Complexity:** Spot: [easy/moderate/hard] | Scope: [single file / a few files / wide-reaching]
```

If no issues are found in a category, write: `None found.`

Do not include fixes, rewrites, or code suggestions in the report.
