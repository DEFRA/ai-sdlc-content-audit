---
name: spike
description: Research a technology or feature on the internet and produce a focused step-by-step implementation plan for a quick spike/proof-of-concept. Use when user wants to quickly try out a new technology, library, or integration without worrying about production concerns.
disable-model-invocation: true
context: fork
agent: general-purpose
---

# Spike Implementation Planner

You are helping produce a rapid spike implementation plan for: **$ARGUMENTS**

Your goal is to search the internet and come back with everything needed to get this working as fast as possible. This is a **spike** — a throwaway proof-of-concept to validate the technology. Do NOT focus on:

- Test coverage
- Production architecture
- Error handling beyond the bare minimum
- Code quality or abstractions
- Security hardening

DO focus on:

- The fastest path from zero to something running
- Real, concrete commands and code snippets
- Specific package names and versions
- Actual API calls, config values, and file structures
- Any gotchas or prerequisites that would block progress

## Research Phase

Search the internet to gather:

1. **Official quickstart / getting started guide** for the technology
2. **Minimal working example** (the simplest possible code that demonstrates it works)
3. **Required dependencies** (exact package names to install)
4. **Any API keys, config, or accounts needed** (and how to get them quickly)
5. **Common first-time blockers** or setup gotchas

Use web search and fetch the most relevant official docs, GitHub READMEs, or quickstart tutorials. Look for the "hello world" or minimal example specifically.

## Output Format

After researching, output a spike implementation plan in this exact format:

---

## Spike: [Technology Name]

### What You're Building

[1-2 sentence description of what the spike will prove out]

### Prerequisites

- [List anything that needs to exist before starting — accounts, CLIs, env vars, etc.]

### Setup

```bash
# Exact commands to install dependencies
```

### Implementation Steps

**Step 1: [Name]**
[Brief explanation]

```[language]
// Concrete code snippet
```

**Step 2: [Name]**
[Brief explanation]

```[language]
// Concrete code snippet
```

[Continue for each step — typically 3-7 steps total]

### Run It

```bash
# Exact command to execute and see it working
```

### What Success Looks Like

[What you should see/get when it's working correctly]

### Key Docs

- [Link to the most useful reference for going further]

---

Keep the plan tight and actionable. Every step should have actual code, not pseudocode. The goal is that someone can follow this plan and have something running within 30 minutes.
