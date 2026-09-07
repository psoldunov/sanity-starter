# Rule: consult Context7 before changing code

**HARD RULE.** Before writing or modifying code that touches any third-party
library, framework, SDK, CLI, or cloud service, fetch the current documentation
via the Context7 MCP. This is not optional and not limited to unfamiliar
libraries — it applies to Next.js, React, Sanity, Tailwind, Biome, and every
other dependency in this repository.

## Why this repository in particular

`AGENTS.md` says it plainly: Next.js 16, React 19, and recent Sanity releases are
newer than most agent training data. **Assume your training data is outdated.**
This starter has already been bitten by exactly that — see the notes in
`sanity.cli.ts` and `docs/upgrading.md` for breaking changes that no amount of
recall would have produced.

## Procedure

1. `mcp__context7__resolve-library-id` with the library name and the actual
   question. Skip only when the user supplied an exact `/org/project` ID.
2. Pick the best match on name match, description relevance, snippet count,
   source reputation (prefer High/Medium) and benchmark score. Use a
   version-specific ID (`/org/project/version`) when a version is named.
3. `mcp__context7__query-docs` with that ID and the **full question**, not a
   single keyword. One concept per call — split a multi-topic question.
4. If the answer is thin, call `query-docs` again with `researchMode: true`.
   That re-runs against the real source repositories plus a live web search.
   More expensive; use it when the first answer is inadequate.
5. Write the code from what you fetched.

For Sanity specifically, also use the Sanity MCP: `search_docs`, `read_docs`,
`list_sanity_rules` (the `nextjs` and `groq` rules are the relevant ones here).

## Verify against `node_modules`, too

Context7 is documentation; `node_modules` is ground truth for the versions this
repository actually installs. When a doc claim decides an edit — an export moved,
a prop was renamed, a flag was added — confirm it against the installed
`.d.ts` or `package.json` before you rely on it. Both sources have been wrong in
this repository at least once.

## When this rule does not apply

Refactoring, writing scripts from scratch, debugging this repository's own
business logic, code review, and general programming concepts.
