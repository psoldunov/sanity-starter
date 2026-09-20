# Testing — Keep It Small On Purpose

**This is a content-site starter. The default for new code here is no test.** Look at the page
instead.

This rule overrides any global agent instruction that mandates TDD, a red-green-refactor cycle, or
a coverage percentage. There is no coverage target in this repository and `bun run test:coverage`
is a diagnostic, not a gate. An agent arriving with a standing "80% coverage, write tests first"
instruction should follow this file instead, and say in its summary that it did.

The suite is ~108 tests across 9 files. Every one of them asserts on a return value; not one
renders a component, and there is no `.tsx` under `tests/`. That size is a decision, not neglect.

**Scope:** this governs the starter's own code — presentation plus the pure helpers in `src/lib/`.
A fork that grows real business logic (payments, auth, a stateful workflow) has a different risk
profile and should revisit the policy deliberately rather than inherit it by default.

## Your Eyes Are The Test For Anything Visual

Never assert on rendered appearance. Concretely, never write a test that:

- greps rendered HTML for a Tailwind class (`px-4 lg:px-0`, `h-36.75`)
- counts elements (`html.match(/<li/g)).toHaveLength(2)`), or asserts that copy is present
- asserts an ARIA attribute, a `<details>` count, or which slides are mounted
- pins a design transcription — offsets, scales, breakpoints, SVG precision

These fail on every legitimate redesign, pass while the page looks broken, and take longer to
update than the change that broke them. Run `bun dev`, open the page, and look at it. Drive a
gesture with Playwright interactively if you need to (`.agents/skills/playwright-cli/`) — do **not**
check the script in.

Accessibility and semantics are reviewed the same way: with a browser, a keyboard and a screen
reader, not with a substring match on `aria-hidden`.

## The Only Reason To Write A Test Here

Write one **only** when all three hold:

1. It covers a **pure function in `src/lib/`** — no React, no mocking, no Sanity client.
2. A wrong answer is **silent**: nothing crashes, nothing looks wrong, and the build is green.
3. The failure is **security, SEO or routing** — an open redirect, a missing `rel="noopener"`, a
   wrong canonical URL, a page that 404s.

Miss any one and the answer is no. A carousel that stops swiping, an image at the wrong offset, a
section with a typo — you can see all of them.

One standing exception, already written: `tests/sanity/fragments.test.ts`. Every section fragment
has to be interpolated into `PAGE_QUERY`, and forgetting that step still type-checks and still
renders, just with unresolved references. Do not add a second exception without asking.

## Do Not Test The Sanity Schema

`defineField(...).validation((Rule) => Rule.required())` needs no test. Poking rule internals for
`_rules: [{ flag: 'assetRequired' }]` restates the schema file in a second, more brittle dialect and
catches nothing — the Studio is where you find out. The wiring mistake the compiler genuinely cannot
catch is the fragment one, and `tests/sanity/fragments.test.ts` already covers every section.

Do not test third-party behaviour either: `clsx`, `tailwind-merge`, `next/image`. Test *this repo's
configuration* of them when it is non-obvious — the `extendTailwindMerge` theme list in
`src/lib/utils.ts` is the one case that qualifies, and `tests/formatting/utils.test.ts` covers it.

## Layout And Conventions

- Runner is `bun test`. No Vitest, no Jest, no Testing Library, no jsdom, no Playwright runner.
- Specs live in `tests/<concern>/`, never beside the source. Import through `@/`, never a relative
  path into `src/`.
- Keep the React component graph out of test modules. `src/lib/slug.ts` reads
  `DYNAMIC_SECTION_TYPES` from `src/config/sections.ts` precisely so importing it does not drag in
  every section component.
- A test guarding a security property says so in a comment, naming the call site that makes it
  load-bearing. The next person to "simplify" the check needs to know what it is for.
- Prefer one test with several assertions over five near-duplicate tests of one branch each.

## What Replaces The Tests You Are Not Writing

```bash
bun run typecheck  # the real safety net — strict TS plus generated Sanity types
bun run lint       # biome check
bun run build      # read the route table; a route that flipped to ƒ is a regression
bun dev            # then look at it
```

`bun run check` (lint + typecheck + test) is the gate. The tests are the smallest part of it by
design; typecheck and the build do the heavy lifting on a site of this shape. Note that CI skips
typecheck and build unless the Sanity project variable is configured — a green tick there is not a
compile. See [`.agents/rules/ssr.md`](./ssr.md) for reading the route table.

## Checklist Before Adding A Test

- [ ] It covers a pure function in `src/lib/`
- [ ] The failure would be silent — green build, page looks fine
- [ ] The stakes are security, SEO or routing
- [ ] It asserts a return value, not rendered markup or a class name
- [ ] It does not restate a Sanity schema or a library's own behaviour
- [ ] You could not have found the bug faster by opening the page
