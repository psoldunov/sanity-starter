# Sanity Starter — Agent Instructions

Source of truth for AI coding agents working in this repo.

## Tech Stack

- **Next.js 16** (App Router) — recent major release
- React 19 (Server Components by default)
- TypeScript (strict mode)
- Sanity CMS
- Tailwind CSS
- Biome (lint + format)
- Bun (package manager — do not introduce npm/yarn commands)

## IMPORTANT: Verify Docs Before Coding

Next.js 16, React 19, and recent Sanity releases are newer than most agent training data. **Assume your training data is outdated.** Before writing or modifying code that touches framework APIs, config, routing, caching, Server Components, Server Actions, middleware, or Sanity client usage:

1. Fetch current docs via Context7 MCP — `mcp__plugin_context7_context7__resolve-library-id` then `query-docs` (preferred for framework/library questions).
2. Or fetch directly: https://nextjs.org/docs, https://react.dev, https://www.sanity.io/docs
3. For Sanity-specific questions, use the Sanity MCP: `search_docs` / `read_docs` / `list_sanity_rules`.

Never rely on memorized APIs for:
- Next.js config (`next.config.ts`, middleware, route handlers, `cacheComponents`, PPR, `'use cache'`)
- React 19 APIs (`use`, Actions, `useActionState`, `useOptimistic`, Server Components rules)
- Sanity v4+ client, `sanityFetch`, Presentation tool, schema v3 constructors

## Architecture Overview

Next.js 16 + Sanity CMS starter with a **section-based page builder**.

- **Route groups**: `(site)` for public pages, `(studio)` for Sanity Studio at `/admin`
- **Catch-all routing**: `[[...slug]]/page.tsx` handles all pages via Sanity slugs
- **Server Components by default**: add `'use client'` only when strictly necessary
- **Section system**: pages composed of reusable section components (Hero, Cards, ImageText, ...)

## Section-Based Architecture

Core pattern is a **section registry system**. To add a new section:

1. **Schema** in `src/sanity/schema/objects/sections/` using `defineSection()`
2. **Component** in `src/components/sections/` with default export, PascalCase file matching `_type`. Type props via the `SectionProps<T>` helper from `@/types`, e.g. `props: SectionProps<'<name>Section'>`. The helper resolves to the matching variant of the `PAGE_QUERY_RESULT.sections` tagged union.
3. **Register schema** in `src/sanity/schema/objects/sections/index.ts` (add to `sectionTypes`)
4. **Register component** in `src/lib/sections.ts` with key matching `_type`
5. **GROQ fragment**: add a plain template literal `const <NAME>_SECTION_FRAGMENT = \`_type == "<name>Section" => { ..., image { ..., asset-> } }\`` to `src/sanity/lib/fragments.ts`, then interpolate it as `${<NAME>_SECTION_FRAGMENT}` inside `PAGE_QUERY` in `src/sanity/lib/queries/index.ts`. Do NOT use function-call interpolation — TypeGen resolves constant refs only.

   **The fragment goes in `src/sanity/lib/fragments.ts`, never in the section schema file, and that module must import nothing.** Fragments used to live beside their schema, which made `src/sanity/lib/queries` import `defineSection` and through it the whole `sanity` Studio runtime — pulling the entire Studio into the bundle of every public route that runs a query, and breaking `next build` outright under the `react-server` condition. The same rule is why `DYNAMIC_SECTION_TYPES` lives in `src/config/sections.ts` rather than in `src/lib/sections.ts`.
6. **Regenerate types**: `bun run typegen` (also runs via `predev` / `prebuild`). Types land in `src/sanity/types/sanity.types.ts` (gitignored). The generated `PAGE_QUERY_RESULT.sections` tagged union picks the new section up automatically.
7. If section needs `searchParams`, add `_type` to `DYNAMIC_SECTION_TYPES` in `src/config/sections.ts` (config, not `src/lib/sections.ts` — that module imports every section component, and `src/lib/slug.ts` must not pull the component graph in)

Keep schema and queries in sync; types are derived, not hand-maintained. `SectionRenderer` maps sections to components automatically.

Example: `heroSection` schema → `HeroSection.tsx` component → registered as `heroSection: HeroSection`.

## Schema Constructors

Use constructors for consistency (located in `src/sanity/schema/constructors/`):

- **`defineSection()`**: base for all sections — auto-adds `id`, `hidden`, `padding` fields in configuration group
- **`defineLink()`**: returns a reference to the shared `link` / `linkWithLabel` registered type (no inline fields). A link resolves to one of: an **internal destination** (`internalDestination` object — a page/post/linkable-doc reference or a static route), an **external URL** (`http`/`https`/`mailto`/`tel`), or a **file download**. Page references support a section anchor (`sectionId` → `#id`). Optional `withLabel` param
- **`defineImage()`**: image field with Sanity CDN, hotspot, dimensions, blurhash

Custom Studio inputs live in `src/sanity/components/` (e.g. `PaddingInput`, `SectionIdInput`).

Schema rules:

- Use `defineField` for inline fields, `defineType` for registered types
- Include descriptions on all fields
- Add `lucide-react` icons to schema types
- Concise, informative `preview` configs (`select` + `prepare`)
- Conditional visibility via `hidden: ({ parent }) => !!parent?.otherField`
- Orderable lists via `@sanity/orderable-document-list`

## Sanity Patterns

**Queries**:

- Location: `src/sanity/lib/queries/index.ts` using `defineQuery()`
- Section fragments: plain template literal constants exported from each section file, interpolated directly into `PAGE_QUERY`
- Link destinations: project the `page` / `destination` field with `${INTERNAL_DESTINATION_PROJECTION}` (from `src/sanity/lib/fragments.ts`) — **not** a bare `page->`. It dereferences the inner `reference->` to `_type`, page `route`, and document `slug`. Reuse it everywhere a link is queried (header menu, footer nav, redirects)
- TypeGen reads `defineQuery()` calls and resolves `${CONST}` interpolation only when the referent is a plain string literal (no function calls, no `.join()`)

**Sanity config** (`sanity.config.ts` — repo root):

- Singleton types: `settings` (no delete/duplicate)
- Read-only actions filtered via `readOnlyActions` Set
- Presentation tool `locations` and `mainDocuments` from `src/sanity/lib/resolve.ts`

**Data fetching**:

- Use `sanityFetch()` from `src/sanity/lib/live.ts` for live preview support
- Access via `const { data } = await sanityFetch({ query, params })`
- Prefer the cached helpers in `src/sanity/lib/fetchers.ts` (`getSettings`, `getPage`, `getPost`) — they wrap `sanityFetch` in `React.cache()` so a value read by both `generateMetadata` and the component costs one round trip
- **Always pass `stega: false` for anything feeding `<head>`** (metadata, sitemap, robots, `generateStaticParams`). Stega encodes invisible characters into strings; in a `<title>` or `og:description` that corrupts search results
- `sanityFetch` returns **stega-branded** types. Plain strings still flow through, but a *literal union* field (`rel`, `padding.top`) is not assignable once branded — derive component props through the `Fetched<T>` helper in `src/types/index.ts`
- Implement draft mode for preview
- Access sibling fields via `useFormValue` with parent path
- Clear dependent fields when parent changes

## Smart Linking System

A link is one of three mutually exclusive things (the Studio hides the others once one is set):

- **Internal destination** — the `page` field holds an `internalDestination` object (`src/sanity/schema/objects/internalDestination.ts`): EITHER a document `reference` (page, post, or any `LINKABLE_DOCUMENTS` type) OR a `staticPath` to a Next route with no document. Page references also support `sectionId` (→ `#anchor`).
- **External URL** — `href` (`http`/`https`/`mailto`/`tel`, relative allowed), with optional `rel` for `http(s)`.
- **File download** — `file` (PDF/ZIP/DOC/TXT), served from the Sanity CDN.

Registry: `src/config/linkables.ts` — `LINKABLE_DOCUMENTS` (doc types besides `page` that can be linked, each with `basePath`/`titleField`/`slugField`) and `STATIC_ROUTES` (Next routes with no document). It drives the Studio picker, the `internalDestination` reference targets, and URL resolution.

`SmartLink` component (`src/components/utility/SmartLink.tsx`):

- Accepts a `link` prop of type `SmartLinkProps` (from `@/types`) — the queried `link` with its `page` dereferenced via `INTERNAL_DESTINATION_PROJECTION`.
- Resolves URL in order: `file` → `href` → internal destination (`resolveDestinationUrl(link.page, link.sectionId)` from `src/lib/links.ts`) → `#` fallback.
- Sets `target` automatically (`getTarget` → `_blank` for `http(s)` URLs, including file downloads; `mailto:`/`tel:` and internal routes open in place). When `_blank`, `rel` defaults to `noopener noreferrer`.
- Usage: `<SmartLink link={link}>Label</SmartLink>` where `link` may carry `{ page, sectionId, href, file, rel, label }`.
- Query link fields with `${INTERNAL_DESTINATION_PROJECTION}` (see Sanity Patterns → Queries), not `page->`.

## Development Workflow

**Commands** (Bun only):

- `bun dev` — dev server (site `:3000`, Studio `:3000/admin`). `predev` regenerates Sanity types first.
- `bun run build` — production build. `prebuild` regenerates Sanity types first.
- `bun run typegen` — extract schema (`schema.json`) + generate `src/sanity/types/sanity.types.ts`
- `bun run typegen:extract` / `bun run typegen:generate` — individual steps
- `bun run lint` — Biome check
- `bun run lint:fix` — Biome check with safe fixes applied
- `bun run format` — Biome auto-format
- `bun run typecheck` — `tsc --noEmit` (needs generated types; run `typegen` first)
- `bun test` — unit tests (Bun's runner; specs live beside sources as `*.test.ts`)
- `bun run test:coverage` — tests with coverage
- `bun run check` — lint + typecheck + test, the gate CI runs
- `bun run analyze` — react-doctor + fallow, the two static analysers CI also runs

Generated artifacts (`schema.json`, `src/sanity/types/sanity.types.ts`) are gitignored and excluded from Biome.

Postinstall script auto-deploys Sanity schema on Vercel production and always runs `bun run typegen`.

**Environment**: see `docs/configuration.md`. Requires `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, and — for draft mode and live preview — `SANITY_API_READ_TOKEN`.

**Never prefix a secret with `NEXT_PUBLIC_`.** That inlines it into the JavaScript every visitor downloads. The read token was previously `NEXT_PUBLIC_SANITY_API_READ_TOKEN` and was therefore public; it is now server-only, held in `src/sanity/env.server.ts`, which is marked `import 'server-only'` so an accidental Client Component import is a build error.

**Package is ESM** (`"type": "module"`). `@sanity/cli` 8 loads `sanity.config.ts` through a Vite SSR worker and the Sanity plugin chain is ESM-only.

## Testing

- Runner is `bun test`; no extra framework. Specs live in `tests/<concern>/`, NOT beside the
  source: `tests/links/`, `tests/routing/`, `tests/images/`, `tests/formatting/`. They import
  through the `@/` alias, never a relative path into `src/`
- Cover the pure modules in `src/lib/` — they hold the URL, slug, link-resolution and date logic and need no mocking
- Keep test modules free of the React component graph. `src/lib/slug.ts` reads `DYNAMIC_SECTION_TYPES` from `src/config/sections.ts` precisely so importing it does not drag in every section component
- A test that guards a security property (open redirect, external-link detection) says so in a comment — the next person to "simplify" the check needs to know what it is for

## Code Style (Biome Enforced)

- **Indentation**: tabs (not spaces)
- **Quotes**: single
- **Semicolons**: required
- **Trailing commas**: multi-line objects/arrays
- **TypeScript strict**: explicit types, avoid `any`, use `import type { ... }`
- **Path alias**: `@/` → `src/`
- **No `console.log`** in committed code — use `console.error` for errors only

## Naming Conventions

- Components: PascalCase, default export, file matches export
- Functions / utilities: camelCase
- Types / interfaces: PascalCase
- Constants: UPPER_SNAKE_CASE or camelCase by context
- Hooks: `useSomething.ts` (camelCase, `use` prefix)
- Sanity schema files: camelCase matching `_type`

## File Layout

- Components: `src/components/` organized by purpose — `layout/`, `sections/`, `utility/`, `elements/`
- Utilities: `src/lib/` — split by concern: `utils.ts` (cn), `image.ts`, `slug.ts`, `url.ts`, `links.ts`, `date.ts`, `sections.ts`, `actions.ts`
- Types: `src/types/` — app-level types (component props, shared types). Constructor-specific types live in `src/sanity/schema/constructors/types.ts`
- Config: `src/config/` — `index.ts` (padding, reserved routes), `linkables.ts`, `sections.ts` (`DYNAMIC_SECTION_TYPES`)
- Fonts: `src/fonts/index.ts`
- Hooks: `src/hooks/` — all re-exported from `src/hooks/index.ts`; must be SSR-safe; clean up listeners/subscriptions in `useEffect` cleanup
- Sanity schema: `src/sanity/schema/` — `documents/`, `objects/`, `constructors/`

## JSDoc

- Required on all exported functions and hooks
- `@param` for each parameter, `@returns` for return value
- **No `@example` blocks**
- Keep descriptions concise

## Imports

- Group: external packages → internal `@/` aliases
- Use `import type { ... }` for types
- Sort logically: React → Next.js → Sanity → project files

## Component Patterns

- Server Components by default; `'use client'` only when needed
- Function components, default export, destructure props at top
- Sections: accept the full props object typed via `SectionProps<'<name>Section'>` and spread it into `<Section>` so base fields (`padding`, `id`, `hidden`) flow through. Destructure section-specific fields after.

```tsx
import Section from '@/components/utility/Section';
import type { SectionProps } from '@/types';

export default function HeroSection(props: SectionProps<'heroSection'>) {
  const { heading, paragraph, image } = props;
  return <Section {...props}>{/* content */}</Section>;
}
```

- **Section wrapper**: use `<Section>` from `src/components/utility/Section.tsx` for consistent padding via `PADDING_CONFIG`
- **Images**: use `SmartImage` for Sanity images (blurhash placeholders + CDN optimization)
- **Links**: use `SmartLink` over raw `<a>` where applicable

## Error Handling

- `try/catch` for async
- Log with `console.error`
- Provide fallback values where sensible

## Performance

- `useMemo` / `useCallback` only when justified
- Optimize Sanity image queries
- Implement proper loading states
- Use Next.js `Image` / `SmartImage` for images

## Accessibility

- Semantic HTML
- Proper ARIA attributes
- Keyboard navigation
- Test with screen readers

## Integration Points

- **Sanity CDN**: `cdn.sanity.io` configured in `next.config.ts`
- **Draft mode**: `src/app/api/draft-mode/enable/route.ts`
- **Vercel**: postinstall deploys schema when `VERCEL_ENV=production`
- **Presentation tool**: live preview with `locations` for page/post navigation

## Critical Files

- `src/lib/sections.ts` — section registry (keys must match schema `_type`)
- `src/config/sections.ts` — `DYNAMIC_SECTION_TYPES` (sections needing `searchParams`)
- `src/sanity/lib/fetchers.ts` — `React.cache()`-wrapped reads; metadata variants pass `stega: false`
- `src/sanity/env.ts` — public Sanity env, validated at load
- `src/sanity/env.server.ts` — `server-only` module holding `SANITY_API_READ_TOKEN`
- `src/lib/slug.ts` — slug normalization and dynamic section detection
- `src/lib/url.ts` — site URL resolution and link target detection (`getTarget`)
- `src/lib/links.ts` — internal destination URL resolution (`resolveDestinationUrl`, `hasDestination`)
- `src/lib/image.ts` — Sanity CDN image URL builder
- `src/sanity/lib/fragments.ts` — ALL GROQ projections, including every section fragment. Imports nothing, on purpose
- `src/sanity/schema/objects/link.ts` — `link` / `linkWithLabel` registered types
- `src/sanity/schema/objects/internalDestination.ts` — polymorphic link destination (document reference or static path)
- `src/sanity/schema/index.ts` — schema entry point
- `src/sanity/schema/constructors/types.ts` — constructor option types (`DefineImageOptions`, `DefineLinkOptions`, `DefineSectionOptions`)
- `src/config/index.ts` — padding config + protected route patterns
- `.fallowrc.jsonc` — fallow config. Read its comments before adding a threshold: several are deliberate calls about what a metric means in a Next+Sanity codebase
- `doctor.config.json` — react-doctor config. Suppresses two rules that misfire on Sanity schema files; the repo scores 86 without it and 100 with it
- `src/config/linkables.ts` — `LINKABLE_DOCUMENTS` + `STATIC_ROUTES` registry (drives link picker, URL resolution, redirect targets)
- `src/fonts/index.ts` — font definitions (Geist Sans / Mono)
- `src/types/index.ts` — shared types including the `SectionProps<T>` helper and `NavLinkItem`

## Do

- Use strict TypeScript with explicit types
- Add JSDoc to new exported functions and hooks
- Use `sanityFetch()` for Sanity data access; keep queries small and focused
- Prefer `SmartImage` / `SmartLink` over raw `<img>` / `<a>`
- Write self-documenting code; use clear names over comments
- Prefer early returns over nested conditionals
- Keep functions small and focused

## Don't

- Change package manager (Bun only)
- Leave `console.log` / debugging code in committed changes
- Create wrapper components around existing sections/utilities
- Mix client and server patterns in one component without a clear reason
- Use `any` without good reason
- Hardcode values that should be configurable
- Skip error handling
- Include `@example` blocks in JSDoc

## When Adding Features

1. **New section**: follow 7-step registry pattern above
2. **New document type**: add schema, update queries, add to Studio desk structure if needed
3. **New link destination**: add a document type to `LINKABLE_DOCUMENTS` or a Next route to `STATIC_ROUTES` in `src/config/linkables.ts` — the Studio picker, `internalDestination` reference targets, and `resolveDestinationUrl` pick it up automatically. For a wholly new link *shape* (beyond destination/URL/file), extend `src/sanity/schema/objects/link.ts` and the `SmartLink` resolver.
4. **Environment changes**: update README and `.env.local` template

## Contribution Checklist

1. Follow patterns in this file and `README.md`
2. Add / update TypeScript types (no implicit `any`)
3. JSDoc on new exported functions and hooks
4. Small, focused changes with clear intent
5. Verify code works as expected
6. Passes Biome formatting / lint
