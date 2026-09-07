# Upgrading

This project sits on the leading edge of Next.js, React and Sanity, so upgrades
break things that no amount of recall predicts. This page records the procedure,
the breaking changes already hit and worked around, and the two version pins
that are deliberate.

## The read token was renamed and must be rotated

**If you are upgrading an existing deployment, do this first.**

The Sanity read token used to be `NEXT_PUBLIC_SANITY_API_READ_TOKEN`. It is now
`SANITY_API_READ_TOKEN`, with no prefix.

The `NEXT_PUBLIC_` prefix made Next inline the token into the JavaScript bundle
every visitor downloads. Anyone who ever loaded the site could read it out of
their own browser's sources tab, and it is in every built bundle ever shipped.
Renaming the variable does not undo that.

Required steps:

1. **Rotate the token.** At **sanity.io/manage → Project → API → Tokens**,
   delete the old token and create a new one with the **Viewer** role.
2. **Rename the variable** to `SANITY_API_READ_TOKEN` everywhere it is set —
   `.env.local`, Vercel, your CI, any other host — with the *new* token's value.
3. **Delete the old variable.** Leaving `NEXT_PUBLIC_SANITY_API_READ_TOKEN`
   defined keeps inlining a value into the bundle.
4. Redeploy.

The token now lives in
[`src/sanity/env.server.ts`](../src/sanity/env.server.ts), which begins with
`import 'server-only'` — importing it from a Client Component is a build error
rather than a silent leak. Public values stay in
[`src/sanity/env.ts`](../src/sanity/env.ts). See
[configuration](./configuration.md).

For clarity on what is still sent to the browser: `next-sanity`'s `defineLive`
takes the same token as `browserToken`, and forwards it over its own
server-action plumbing when a draft-capable live connection is opened. That is a
runtime transfer on the preview path only — not an inline into every public
bundle — which is exactly why the token must be Viewer-scoped and nothing more.

## Breaking changes hit upgrading to `sanity@6` / `@sanity/cli@8` / `next-sanity@13`

Three real ones. Each is worked around in the repository already; they are
documented so you recognise them if you touch the relevant file.

### `Error: Schema file already exists`

**Symptom.** `bun run typegen` (or `bun dev`, or `bun run build`, both of which
run it) fails at the extract step:

```
Error: Schema file already exists
```

**Cause.** `sanity schema extract` now refuses to overwrite an existing
`schema.json`. Since typegen runs on every dev start and every build, the second
run always finds the file from the first.

**Fix.** The `--force` flag, already in the script
([`package.json`](../package.json)):

```json
"typegen:extract": "sanity schema extract --path=./schema.json --enforce-required-fields --force"
```

`schema.json` is a gitignored build artefact, so overwriting it is always
correct here.

### `Error: exports is not defined` during schema extraction

**Symptom.** `bun run typegen` fails while loading the Studio config:

```
Error: exports is not defined
```

**Cause.** The CLI loads `sanity.config.ts` inside a Vite SSR worker configured
with `ssr.noExternal: true`, which forces every dependency — CommonJS ones
included — through the ESM transform. Two transitive dependencies of
`@sanity/orderable-document-list@2` (`lexorank` and `@hello-pangea/dnd`) are
plain CJS with no `exports` map, so bundling them produces that error and schema
extraction fails.

**Fix.** The `vite` hook in [`sanity.cli.ts`](../sanity.cli.ts) puts both
packages back on `ssr.external`, which takes precedence over `ssr.noExternal`
and leaves them to Node's own CJS loader:

```ts
vite: (config) => ({
	...config,
	ssr: {
		...config.ssr,
		external: [
			...(Array.isArray(config.ssr?.external) ? config.ssr.external : []),
			'lexorank',
			'@hello-pangea/dnd',
		],
	},
}),
```

Only CLI commands read this config — the Next build bundles the embedded Studio
itself and is unaffected. Remove the hook once the upstream packages ship ESM
builds. If a *different* CJS dependency starts failing the same way, add it to
that array.

### Stega-branded types from `sanityFetch`

**Symptom.** After the upgrade, type errors on string fields that were fine
before — typically on a field typed as a literal union, such as a link's `rel`
or a section's `padding.top`:

```
Type 'StegaString<"noopener">' is not assignable to type '"noopener" | "noopener noreferrer"'.
```

**Cause.** `sanityFetch` now returns deep **stega-branded** types. In draft mode
strings may carry invisible click-to-edit characters, so every string property
comes back as `StegaString`. That is a template-literal subtype of `string`, so
ordinary string fields still flow through unchanged — but a *literal union* is
no longer assignable once branded.

**Fix.** Component prop types derive from the branded result rather than from
raw TypeGen output. [`src/types/index.ts`](../src/types/index.ts):

```ts
type Fetched<T> = StegaBranded<NonNullable<T>>;

type SectionUnion = Fetched<PAGE_QUERY_RESULT>['sections'][number];

export type SectionProps<T extends SectionUnion['_type']> = Extract<
	SectionUnion,
	{ _type: T }
>;
```

`SiteSettings`, `PostListItem` and `SectionBaseProps` are derived the same way.
Two consequences when you extend the types:

- Derive new prop types through `Fetched<T>`, not from the generated result
  directly.
- Where a hand-built value must also be accepted — `SmartLinkProps`, which takes
  `{ href: '/' }` for a logo as readily as a queried link — the type is written
  by hand with `rel` as a plain `string`, because the generated literal union
  does not survive branding.

Use `stegaClean()` (as `<Section>` does for `padding` and `id`) when a branded
string has to be compared against a literal at runtime.

## TypeScript stays on 6.x, deliberately

[`package.json`](../package.json) pins `"typescript": "^6.0.3"`. Do not bump it
to 7 yet.

TypeScript 7 ships no programmatic API. The `plugins: [{ "name": "next" }]`
language-service plugin in [`tsconfig.json`](../tsconfig.json) depends on that
API, so under TS 7 it silently stops loading — no error, no warning — and you
lose Next's editor-side checks: Server/Client Component boundary diagnostics,
`'use client'` misuse, invalid metadata exports.

This is a decision to revisit at **TypeScript 7.1**, when the programmatic API is
expected to return. It is not an oversight. `bun run typecheck` (`tsc --noEmit`)
is unaffected either way; what is at stake is the editor experience.

## Dependency policy

Declare what you import. Several packages were previously only present as
hoisted transitive dependencies and are now direct dependencies, because the
source imports them by name: `sanity`, `styled-components`, `@sanity/ui`,
`@sanity/icons`, `@sanity/image-url`, `@sanity/asset-utils`, plus
`@portabletext/react` and `server-only`. Relying on hoisting is a bug waiting
for a package-manager change.

The reverse also applies — two packages were removed:

- **`jotai`**: zero atoms in the codebase, and its `Provider` wrapped `<html>`,
  putting the entire tree in a client boundary. If you need client state, add a
  store back deliberately and mount its provider as deep as it will go.
- **`react-icons`**: one glyph in use, replaced with inline SVG. Icons in the
  Studio come from `lucide-react` and `@sanity/icons`.

## Upgrade procedure

```bash
bun outdated                 # see what moved
bun update --latest <pkg>    # one package or one coherent group at a time
bun run typegen              # schema extraction breaks first and loudest
bun run check                # lint, typecheck, tests
bun run build                # the real gate
bun dev                      # click through /, /posts, /posts/<slug>, /admin
```

Notes:

- **Upgrade in groups, not all at once.** `next` + `react` + `react-dom`
  together; `sanity` + `@sanity/cli` + `next-sanity` together. A failure in a
  batch of twenty tells you nothing.
- **`bun run typegen` is the canary.** Schema extraction loads the Studio config
  through the Sanity CLI's own bundler, which is where CJS/ESM problems show up
  first.
- **Check the embedded Studio in a browser.** Type-checking does not exercise
  the Studio runtime; a broken plugin only shows up when `/admin` renders.
- **Consult current documentation before changing framework code.** Next 16,
  React 19 and recent Sanity releases are newer than most model training data.
  The repository has a hard rule about this in
  [`.claude/rules/context7.md`](../.claude/rules/context7.md), and
  `node_modules` is the final ground truth for the versions you actually
  installed.
- **Read the upstream upgrade guides**:
  [Next.js](https://nextjs.org/docs/app/guides/upgrading),
  [Sanity](https://www.sanity.io/docs), [React](https://react.dev/blog).

## Pinned on purpose

| Package | Pin | Why |
| --- | --- | --- |
| `typescript` | `^6.0.3` | TS 7 drops the programmatic API the `next` language-service plugin needs. Revisit at 7.1. |
| `bun` | `1.4.2` (in [`mise.toml`](../mise.toml)) | Reproducible toolchain across machines and CI. |
| `@biomejs/biome` | `2.5.12`, exact | Formatter output must not change under a patch bump and reformat unrelated files. |

Related: [configuration](./configuration.md) · [troubleshooting](./troubleshooting.md)
