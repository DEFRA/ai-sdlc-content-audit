# Write Skill File

Create a task-oriented skill in `.agents/skills/` that guides an agent through a specific, repeatable workflow.

## Metadata

```yaml
triggers:
  - 'create a skill'
  - 'write a skill file'
  - 'add a skill'
  - 'new agent skill'
  - 'write a workflow'
```

## When to Use

Use this skill when asked to create, add, or write a skill file for a repeatable task or workflow that an agent should follow.

## Input / Output

**Input:** The task or workflow the skill should accomplish. If not provided, ask the user before proceeding.
**Output:** A new file at `.agents/skills/<verb-phrase>/SKILL.md` following the required format below.

## Instructions

### Step 1: Clarify the task

Determine exactly what task the skill will help accomplish. The skill name must be a verb-phrase answering: "What task does this help accomplish?" Examples: `write-skill/`, `code-review/`, `plan-feature/`, `write-migration/`.

If the task is unclear, ask the user before proceeding.

### Step 2: Identify the triggers

Write the trigger conditions — the specific phrases or situations that tell the agent to load this skill. This is the most critical part of the skill: poor triggers mean the skill is never found.

- Include 3–6 phrases covering natural variations of the request. Examples: `"create API endpoint"`, `"write a migration"`, `"review this PR"`.

### Step 3: Write the persona

Write 2–4 sentences that define the agent's role, stance, and constraints. The persona is the single source of truth for how the agent behaves. It must answer:

- What is this agent's job?
- How does it approach the task?
- What does it explicitly not do?

### Step 4: Define inputs and outputs

State explicitly:

- **Input:** What information the agent needs to begin (e.g., task name, scope, user-provided constraints).
- **Output:** What the final deliverable looks like (e.g., a file at a specific path, a structured response).

Unambiguous inputs and outputs dramatically increase agent success rates.

### Step 5: Write the procedure

Write ordered steps for completing the task. Each step must:

- Start with a bold action label: `**Step N: Name.**`
- Describe one concrete action.
- Avoid vague instructions like "consider X" — state exactly what to do.

### Step 6: Write the file

Create the skill at `.agents/skills/<verb-phrase>/SKILL.md` following the required format below.

### Step 7: Update AGENTS.md

Add the new skill to the skills table in `AGENTS.md`.

## Checklist

Verify every item below before writing the file:

- [ ] Skill name is a verb-phrase in kebab-case
- [ ] `triggers` lists 3–6 concrete, unambiguous phrases
- [ ] `## Persona` is present and describes the agent's role, approach, and constraints
- [ ] Inputs and outputs are explicitly defined
- [ ] Every procedure step is a positive imperative: "Do X" rather than "Don't do Y"
- [ ] No coding conventions (those belong in `.agents/rules/`)
- [ ] No project-wide setup (that belongs in `AGENTS.md`)
- [ ] File is self-contained with no external links
- [ ] File is as short as possible while remaining complete (target: under 300 lines)

## Required Output Format

Every `SKILL.md` must follow this structure exactly:

````markdown
# [Task Name]

[One sentence: what task this skill helps accomplish.]

## Metadata

```yaml
triggers:
  - '[trigger phrase]'
  - '[trigger phrase]'
```

## When to Use

Use this skill when [concrete trigger description].

## Input / Output

**Input:** [What the agent needs to start]
**Output:** [What the deliverable looks like — file path, format, or structure]

## Persona

[2–4 sentences: the agent's role, approach, and what it does not do.]

## Instructions

### Step 1: [Action]

[Concrete action in imperative voice.]
````

### Content rules

- Write every step as a positive imperative: "Use X" rather than "Don't use Y".
- Define measurable goals where possible: "Write steps under 3 sentences" not "Keep steps short".
- State each idea once — do not repeat a concept across sections.
- Keep the file as short as possible while remaining complete.
