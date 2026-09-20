# Docs First — Never Code From Memory

**HARD RULE.** Before writing or modifying code that touches any third-party library, framework,
SDK, CLI or cloud service, read the current documentation. This is not optional and not limited to
unfamiliar libraries — it applies to Next.js, React, Sanity, Tailwind, Biome and every other
dependency here.

**Assume any API you recall from memory is wrong until a doc confirms it.**

## Why this repository in particular

`AGENTS.md` says it plainly: Next.js 16, React 19 and recent Sanity releases are newer than most
agent training data. This starter has already been bitten by exactly that — see the notes in
`sanity.cli.ts` and [`docs/upgrading.md`](../../docs/upgrading.md) for breaking changes no amount of
recall would have produced.

## Lookup Order

1. **Bundled docs in `node_modules`** — the exact version installed here. Always check first.
2. **Context7 MCP** — `resolve-library-id` → `query-docs` with the full question.
3. **Web search** — only when 1 and 2 come up empty. Prefer official domains; check the page's
   version.

Stop at the first source that answers the question, and name where the answer came from when you
report back.

This order deliberately refines a global "Context7 first" instruction, if you carry one. The
bundled docs are faster than any network call, they cannot be stale relative to the code they ship
beside, and they are versioned exactly. Context7 still beats a web search.

## Step 1: Bundled Docs

Next.js ships its full documentation set inside the package:

```bash
ls node_modules/next/dist/docs/                        # 01-app, 02-pages, 03-architecture
ls node_modules/next/dist/docs/01-app/03-api-reference # directives, components, file-conventions, functions, config, cli
rg -l "cacheComponents" node_modules/next/dist/docs/   # find the right page by keyword
```

Heed every deprecation notice you find there. That is how the `priority` → `preload` change in
`SmartImage` was caught: `node_modules/next/dist/shared/lib/get-img-props.d.ts` marks `priority` as
deprecated, and `docs/01-app/03-api-reference/02-components/image.md` says what replaced it and when
*not* to use it.

For any other dependency, check before assuming there is nothing:

```bash
ls node_modules/<pkg>/{docs,dist/docs} 2>/dev/null
rg -n '"(types|exports)"' node_modules/<pkg>/package.json   # entry points and shipped .d.ts
```

Failing prose docs, the shipped `.d.ts` files are authoritative for signatures. `node_modules` is
ground truth for the versions this repository actually installs — when a doc claim decides an edit
(an export moved, a prop was renamed, a flag was added), confirm it there before you rely on it.
Both sources have been wrong in this repository at least once.

## Step 2: Pin the Version Before You Ask

Read the installed version out of `package.json` / `bun.lock` and put it in the query. A Context7
answer for the wrong major is worse than no answer.

```bash
rg '"(next|react|sanity|next-sanity|tailwindcss|@biomejs/biome)"' package.json
```

At the time of writing: `next@16.3.4`, `react@19.3`, `sanity@6.14`, `next-sanity@13.3`,
`tailwindcss@4.3`, `@biomejs/biome@2.5.14`, `bun@1.4.2`. Re-read them rather than trusting this
line — it goes stale too.

Then:

1. `resolve-library-id` with the library name and the actual question. Skip only when an exact
   `/org/project` ID was supplied.
2. Pick the best match on name match, description relevance, snippet count, source reputation
   (prefer High/Medium) and benchmark score. Use a version-specific ID (`/org/project/version`) when
   a version is named.
3. `query-docs` with that ID and the **full question**, not a single keyword. One concept per call —
   split a multi-topic question.
4. If the answer is thin, call `query-docs` again with `researchMode: true`. That re-runs against
   the real source repositories plus a live web search. More expensive; use it when the first answer
   is inadequate.

For Sanity specifically, also use the Sanity MCP: `search_docs`, `read_docs`, `list_sanity_rules`
(the `nextjs` and `groq` rules are the relevant ones here).

## When This Applies

Consult docs for: API syntax and signatures, config files, file and route conventions, version
migrations, setup and install steps, CLI flags, and library-specific debugging.

Skip it for: refactoring existing code, business-logic bugs in this repository, code review, and
general programming questions that involve no external API.

## Checklist

- [ ] Checked `node_modules/<pkg>/dist/docs` (or `docs/`, or the `.d.ts`) before writing
- [ ] Read the installed version, not the latest release
- [ ] Fell through to Context7 / web only after the bundled docs came up short
- [ ] Named the source in the summary so the next session can verify it
