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
2. **Component** in `src/components/sections/` with default export, PascalCase file matching `_type`. Derive props from the generated union: `Extract<NonNullable<PAGE_QUERY_RESULT>['sections'][number], { _type: '<name>Section' }>`
3. **Register schema** in `src/sanity/schema/objects/sections/index.ts` (add to `sectionTypes` + re-export the GROQ fragment constant)
4. **Register component** in `src/lib/sections.ts` with key matching `_type`
5. **GROQ fragment**: export a plain template literal `const <NAME>_SECTION_FRAGMENT = \`_type == "<name>Section" => { ..., image { ..., asset-> } }\`` and reference it directly via `${<NAME>_SECTION_FRAGMENT}` inside `PAGE_QUERY` in `src/sanity/lib/queries/index.ts`. Do NOT use function-call interpolation inside fragments — TypeGen statically resolves constant refs only.
6. **Regenerate types**: `bun run typegen` (also runs via `predev` / `prebuild`). Types land in `src/sanity/types/sanity.types.ts` (gitignored). The generated `PAGE_QUERY_RESULT.sections` tagged union picks the new section up automatically.
7. If section needs `searchParams`, add `_type` to `dynamicSections` in `src/lib/sections.ts`

Keep schema and queries in sync; types are derived, not hand-maintained. `SectionRenderer` maps sections to components automatically.

Example: `heroSection` schema → `HeroSection.tsx` component → registered as `heroSection: HeroSection`.

## Schema Constructors

Use constructors for consistency (located in `src/sanity/schema/constructors/`):

- **`defineSection()`**: base for all sections — auto-adds `id`, `hidden`, `padding` fields in configuration group
- **`defineLink()`**: smart link supporting page references, section anchors (`#id`), external URLs, file downloads. Optional `withLabel` param
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
- TypeGen reads `defineQuery()` calls and resolves `${CONST}` interpolation only when the referent is a plain string literal (no function calls, no `.join()`)

**Sanity config** (`sanity.config.ts` — repo root):

- Singleton types: `settings` (no delete/duplicate)
- Read-only actions filtered via `readOnlyActions` Set
- Presentation tool `locations` and `mainDocuments` from `src/sanity/lib/resolve.ts`

**Data fetching**:

- Use `sanityFetch()` from `src/sanity/lib/live.ts` for live preview support
- Access via `const { data } = await sanityFetch({ query, params })`
- Implement draft mode for preview
- Access sibling fields via `useFormValue` with parent path
- Clear dependent fields when parent changes

## Smart Linking System

`SmartLink` component (`src/components/utility/SmartLink.tsx`):

- Accepts `link` prop matching `defineLink()` schema
- Resolves: page reference → route slug, optional section ID → hash anchor, or external URL
- Sets `target` automatically based on URL type
- Usage: `<SmartLink link={link}>Label</SmartLink>` where `link` has optional `{ page, sectionId, url, label }`

## Development Workflow

**Commands** (Bun only):

- `bun dev` — dev server (site `:3000`, Studio `:3000/admin`). `predev` regenerates Sanity types first.
- `bun run build` — production build. `prebuild` regenerates Sanity types first.
- `bun run typegen` — extract schema (`schema.json`) + generate `src/sanity/types/sanity.types.ts`
- `bun run typegen:extract` / `bun run typegen:generate` — individual steps
- `bun run lint` — Biome check
- `bun run format` — Biome auto-format

Generated artifacts (`schema.json`, `src/sanity/types/sanity.types.ts`) are gitignored and excluded from Biome.

Postinstall script auto-deploys Sanity schema on Vercel production and always runs `bun run typegen`.

**Environment**: see README. Requires `NEXT_PUBLIC_SANITY_*` vars and `SANITY_API_WRITE_TOKEN`.

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

- Components: `src/components/` organized by purpose — `layout/`, `sections/`, `utility/`
- Utilities: `src/lib/` (pure, testable)
- Types: `src/types/` (centralized, exported from `index.ts` or dedicated files)
- Hooks: `src/hooks/` — all re-exported from `src/hooks/index.ts`; must be SSR-safe (guard `typeof window !== 'undefined'`); clean up listeners/subscriptions in `useEffect` cleanup
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
- Sections: accept props matching schema + optional `searchParams`

```tsx
export default function HeroSection({ heading, paragraph, image }: HeroSectionProps) {
  return <Section>{/* content */}</Section>;
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
- **Draft mode**: `app/api/draft-mode/enable/route.ts`
- **Vercel**: postinstall deploys schema when `VERCEL_ENV=production`
- **Presentation tool**: live preview with `locations` for page/post navigation

## Critical Files

- `src/lib/sections.ts` — section registry (keys must match schema `_type`)
- `src/sanity/schema/index.ts` — schema entry point
- `src/config/index.ts` — padding config + protected route patterns
- `src/types/index.ts` — shared types (section types live beside schema in `src/sanity/schema/objects/sections/index.ts`)

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
3. **New link type**: extend `defineLink()` and update `SmartLink` resolver
4. **Environment changes**: update README and `.env.local` template

## Contribution Checklist

1. Follow patterns in this file and `README.md`
2. Add / update TypeScript types (no implicit `any`)
3. JSDoc on new exported functions and hooks
4. Small, focused changes with clear intent
5. Verify code works as expected
6. Passes Biome formatting / lint
