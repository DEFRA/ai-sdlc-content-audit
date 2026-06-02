# AI Agnosticism

All AI content lives in `.agents/`. Platform files provide only the minimum context required for each tool to load the project.

## Scope

This applies to all AI platform configuration files and any top-level documentation files.

## Top-level project files

The only top-level project reference files are `AGENTS.md` and `ARCHITECTURE.md`. All other AI content lives inside `.agents/`.

## Platform wrappers

Each supported AI platform has a wrapper file placed where the platform requires it:

| Platform       | File                              |
| -------------- | --------------------------------- |
| Claude Code    | `CLAUDE.md`                       |
| Cursor         | `.cursor/rules/project.mdc`       |
| GitHub Copilot | `.github/copilot-instructions.md` |

Each wrapper contains exactly two things:

- A one-line project description
- A pointer to `AGENTS.md` as the full AI system reference

## Where AI content lives

| Content type     | Location                                         |
| ---------------- | ------------------------------------------------ |
| Coding rules     | `.agents/rules/<concern>.md`                     |
| Agent behaviour  | `## Persona` in `.agents/skills/<name>/SKILL.md` |
| Platform context | The platform's wrapper file                      |

## Directives

- Write all coding rules in `.agents/rules/`.
- Write all agent behaviour in the relevant `SKILL.md`.
- Keep each platform wrapper to a project description and a pointer to `AGENTS.md`.
- Write each rule once — `AGENTS.md` is the single source of truth across all platforms.
