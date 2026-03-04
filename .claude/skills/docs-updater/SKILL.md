# Docs Updater

A skill that reviews repository changes and maintains end-user documentation:
a **user guide** and a **structured changelog**, both written in markdown and
designed for hosting with mkdocs.

## When to Use

Use this skill whenever the user asks to:
- Update docs, update the user guide, update the changelog
- Document changes, write release notes, or says "update docs"
- Mentions handoff, wrapping up, or finishing a session and documentation exists or should exist

Works with any repository — creates the docs structure if it doesn't exist yet.

## Philosophy

Documentation should be written for the people who use the software, not the
people who build it. Every update should ask: "what can users now do that they
couldn't before, and what do they need to know?"

Avoid developer jargon, internal implementation details, and code references
unless the product is a developer tool. Write in plain, warm language.

---

## Scope

This skill supports several modes based on what the user wants to document.
If the user doesn't specify a scope, default to **session**.

| Scope        | What it covers                                    | How to determine it                          |
|------------- |---------------------------------------------------|----------------------------------------------|
| `session`    | Changes made in the current working session       | `git diff HEAD` (uncommitted + staged)       |
| `staged`     | Only staged changes                               | `git diff --cached`                          |
| `uncommitted`| All working tree changes (staged + unstaged)      | `git diff HEAD`                              |
| `committed`  | All commits since docs were last updated          | Read last documented hash from `.docs-state.json`, then `git log <hash>..HEAD` |
| `range`      | Explicit git range provided by user               | User supplies e.g. `main..feature-branch`    |

The user may say things like:
- "update docs" → default to `session`
- "update docs for everything since last release" → use `committed`
- "document changes on this branch" → use `range` with current branch vs main
- "update the changelog" → only update the changelog, same scope logic

---

## Steps

### 1. Determine scope and gather changes

Based on the scope (see table above), run the appropriate git commands to
collect the diff and/or commit log. Summarise what has changed at a high level
before proceeding — group changes by area of impact (new features, changed
behaviour, fixes, removed functionality).

For `committed` scope, read `docs/.docs-state.json` to find the last
documented commit hash. If the file doesn't exist, treat the entire repo
history as undocumented and generate initial docs from the full codebase.

### 2. Check for existing docs structure

Look for a `docs/` directory in the repository root. If it doesn't exist,
create the full structure (see **Docs structure** below). If it does exist,
read the current `user-guide.md` and `changelog.md` to understand what's
already documented.

### 3. Update the changelog

Update `docs/changelog.md` first. This is the more mechanical step and helps
build understanding for the user guide update.

Follow the **Keep a Changelog** format (https://keepachangelog.com/). Each
release or update session gets a dated section. Group entries under these
headings as appropriate:

- **Added** — new features or capabilities
- **Changed** — changes to existing functionality
- **Fixed** — bug fixes
- **Removed** — features that have been taken away

Write every entry from the user's perspective. Not "refactored auth module"
but "Signing in is now faster and more reliable."

If this is the first changelog entry, add the header and preamble.

### 4. Update the user guide

Read the existing `docs/user-guide.md` (or create it if new). The user guide
is **feature-oriented** — it describes what the product does and how to use it,
organised by task or feature area.

Rules for updating:
- **Add** new sections for genuinely new features
- **Revise** existing sections where behaviour has changed
- **Remove** references to features that no longer exist
- **Don't rewrite** sections that haven't been affected by the changes
- Maintain the existing structure and voice unless it needs correction

The user guide should read as a coherent, standalone document at all times —
not as a patchwork of incremental updates.

### 5. Update docs state

Write the current HEAD commit hash to `docs/.docs-state.json`:

```json
{
  "last_documented_commit": "<full-sha>",
  "last_updated": "<ISO-8601-datetime>",
  "updated_by": "docs-updater-skill"
}
```

This enables the `committed` scope to work correctly next time.

### 6. Summary

After making all changes, provide a brief summary of what was updated:
- How many changelog entries were added
- Which user guide sections were added, revised, or removed
- Any sections that might need manual review (e.g. if a change was ambiguous)

Do not ask for confirmation before writing — just make the changes. The user
can review the diff themselves.

---

## Docs structure

When creating the docs folder for the first time:

```
docs/
├── index.md              # Overview / landing page (brief product description)
├── user-guide.md         # Feature-oriented guide for end users
├── changelog.md          # Structured changelog (Keep a Changelog format)
├── .docs-state.json      # Tracks last documented commit
└── mkdocs.yml            # Basic mkdocs config (placed in repo root, not docs/)
```

Note: `mkdocs.yml` should be created in the **repository root**, not inside
`docs/`. It should reference `docs/` as the docs directory.

### Initial mkdocs.yml template

```yaml
site_name: "[Project Name] Documentation"
docs_dir: docs
theme:
  name: material
  palette:
    primary: teal
nav:
  - Home: index.md
  - User Guide: user-guide.md
  - Changelog: changelog.md
```

### Initial index.md template

```markdown
# [Project Name]

Brief description of what this product does and who it's for.

## Getting started

[Quick orientation for new users]

## Need help?

[Contact/support information if available]
```

### Initial changelog.md template

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

```

### Initial user-guide.md template

```markdown
# User Guide

[This guide covers everything you need to know about using Project Name.]

```

---

## Writing style

- **Audience**: End users, not developers. Write as if explaining to someone
  who has never seen the codebase.
- **Tone**: Warm, clear, helpful. Not corporate, not overly casual.
- **Structure**: Use headings, short paragraphs, and step-by-step instructions
  where appropriate.
- **Avoid**: Code snippets (unless the product is a developer tool), internal
  terminology, passive voice where active is clearer.
- **Changelog entries**: One line per change. Start with what the user
  experiences, not what the developer did.

---

## Edge cases

- **No changes detected**: Tell the user there's nothing new to document.
  Don't touch the files.
- **Only internal/refactoring changes**: Note in the summary that changes were
  internal and don't affect the user guide. Add a brief changelog entry under
  "Changed" if performance or reliability improved noticeably, otherwise skip.
- **Breaking changes**: Flag prominently in both the changelog (with a
  warning prefix) and the user guide. Update affected sections immediately.
- **First run on existing repo**: Generate comprehensive initial documentation
  from the full codebase, not just recent changes.
- **Multiple features in one session**: Group related changes together in the
  user guide rather than creating many small sections.

---

## Failed Attempts

- Don't write documentation in developer language — always translate to user-facing language
- Don't rewrite unchanged sections of the user guide — only touch what the changes affect
- Don't skip creating `.docs-state.json` — without it the `committed` scope can't work next time
- Don't put `mkdocs.yml` inside `docs/` — it belongs in the repository root
- Don't generate docs when there are no changes — tell the user and leave files untouched
