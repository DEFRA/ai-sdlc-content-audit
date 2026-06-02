# AGENTS.md

This file is the canonical reference for how AI agents, rules, and skills are organised in this project. It is
platform-agnostic — the same structure is used by Claude, Cursor, GitHub Copilot, and any other AI tooling.

## Related files

| File              | Purpose                                                              |
| ----------------- | -------------------------------------------------------------------- |
| `ARCHITECTURE.md` | Project overview, tech stack, feature architecture, and run commands |
| `STYLING.md`      | Defra visual styling rules and component reference                   |
| `AGENTS.md`       | This file — AI agent system reference                                |

## Principle

All AI-specific content lives in `.agents/`. Platform configuration files (`CLAUDE.md`, `.cursor/rules/`,
`.github/copilot-instructions.md`) are thin wrappers that point here. **Do not add rules, skills, or agent definitions
directly to a platform file.** Add them to the appropriate place in `.agents/` instead.

## Directory Structure

```
.agents/
  rules/          # Project rules — loaded into agent instructions at runtime
  skills/         # Skills — one directory per skill, each containing a SKILL.md
```

### `rules/`

Plain-markdown rule files. Each file covers one concern. Current rules:

| File                       | Covers                                                           |
| -------------------------- | ---------------------------------------------------------------- |
| `ai-agnosticism.md`        | Where AI content lives and why platform files are thin wrappers  |
| `code-style.md`            | JavaScript standards, constants, fetch, Nunjucks conventions     |
| `config.md`                | Convict schema rules, startup validation, defaults policy        |
| `logging.md`               | Pino logging structure, security, log levels                     |
| `naming.md`                | Identifier naming — functions, variables, constants, directories |
| `server-architecture.md`   | Feature and service directory structure, dependency flow, naming |
| `single-responsibility.md` | Module and function cohesion rules                               |
| `styling.md`               | Defra component prefix, SCSS file locations, styling priority    |
| `testing.md`               | Test naming, data organisation, assertion style                  |

To add a new rule: use the `create-rule` skill, or create/edit a file directly in `.agents/rules/`.

### `skills/` — current skills

| Skill                          | Triggered by                                               |
| ------------------------------ | ---------------------------------------------------------- |
| `create-rule`                  | Creating a new rules file                                  |
| `create-skill`                 | Creating a new skill file                                  |
| `feature-create-specification` | Writing a feature specification                            |
| `feature-plan`                 | Planning a feature implementation                          |
| `feature-review-tests`         | Reviewing planned test names                               |
| `feature-review-styling`       | Reviewing planned styling approach                         |
| `feature-write`                | Writing the feature implementation                         |
| `feature-review-code`          | Reviewing implemented code for consistency                 |
| `feature-create-pr`            | Branching, committing, pushing, and opening a pull request |
| `review-docs`                  | Reviewing documentation for misalignment with the codebase |
| `routing`                      | Routing user requests to the right skill                   |
| `spike`                        | Exploratory research and prototyping                       |

### `skills/`

Each skill lives in its own directory: `.agents/skills/<skill-name>/SKILL.md`.

The routing agent reads all `SKILL.md` files automatically to discover available agents. Do not register agents manually
anywhere else.

To add a new skill: use the `create-skill` skill. It defines the required `SKILL.md` structure and output format.

## Adding or Changing Things

| I want to…                     | Where to change                        |
| ------------------------------ | -------------------------------------- |
| Change how an agent behaves    | Edit `## Persona` in its `SKILL.md`    |
| Add a project-wide coding rule | Add or edit a file in `.agents/rules/` |
| Add a new skill                | Use the `create-skill` skill           |
| Add a new rule                 | Use the `create-rule` skill            |
