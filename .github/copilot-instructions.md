# Sanity Starter AI Coding Instructions

## Architecture Overview

This is a **Next.js 16 + Sanity CMS** starter with a **section-based page builder**. Key patterns:

- **Route groups**: `(site)` for public pages, `(studio)` for Sanity Studio at `/admin`
- **Catch-all routing**: `[[...slug]]/page.tsx` handles all pages via Sanity slugs
- **Server Components by default**: Only add `'use client'` when needed
- **Section system**: Pages are composed of reusable section components (Hero, Cards, ImageText)

## Section-Based Architecture

The core pattern is a **section registry system**:

1. **Define schema** in `src/sanity/schema/objects/sections/` using `defineSection()` constructor
2. **Create component** in `src/components/sections/` matching the schema `_type` name
3. **Register in registry**: Add to `src/lib/sections.ts` object with key matching `_type`
4. **Add query fragment**: Add GROQ fragment in `src/sanity/lib/queries/fragments.ts` to `SECTIONS_FRAGMENTS` array
5. **Render**: `SectionRenderer` automatically maps sections to components

Example: `heroSection` schema → `HeroSection.tsx` component → registered as `heroSection: HeroSection`

## Schema Constructors

Use **schema constructors** for consistency:

- **`defineSection()`**: Base for all sections. Auto-adds `id`, `hidden`, `padding` fields with configuration group
- **`defineLink()`**: Smart link supporting page references, section anchors (#id), or external URLs. Optional `withLabel` param
- **`defineImage()`**: Image field with Sanity CDN, hotspot, dimensions, and blurhash support

Custom inputs go in `src/sanity/components/` (e.g., `PaddingInput`, `SectionIdInput`)

## Sanity Patterns

**Query organization**:
- Queries in `src/sanity/lib/queries/index.ts` using `defineQuery()`
- Fragments in `fragments.ts` for reusable GROQ parts
- Use `getImageFragment('fieldName')` helper for image fields with blurhash

**Sanity config** (`src/sanity.config.ts`):
- Singleton types: `settings` (prevent delete/duplicate)
- Read-only actions filtered via `readOnlyActions` Set
- Presentation tool configured with `locations` and `mainDocuments` from `src/sanity/lib/resolve.ts`

**Data fetching**:
- Use `sanityFetch()` from `src/sanity/lib/live.ts` for live preview support
- Access via `const { data } = await sanityFetch({ query, params })`

## Smart Linking System

**`SmartLink` component** (`src/components/utility/SmartLink.tsx`):
- Accepts `link` prop with `defineLink()` schema shape
- Resolves: page reference → route slug, optional section ID → hash anchor, or external URL
- Automatically sets `target` attribute based on URL type

**Usage**: `<SmartLink link={link}>Label</SmartLink>` where `link` has optional `{ page, sectionId, url, label }`

## Development Workflow

**Package manager**: Bun exclusively (`bun install`, `bun dev`, `bun run build`)

**Commands**:
- `bun dev`: Local dev server (site at `:3000`, Studio at `:3000/admin`)
- `bun run lint`: Biome linter check
- `bun run format`: Biome auto-format
- Postinstall script auto-deploys schema on Vercel production

**Environment**: See `.env.local` setup in README. Requires `NEXT_PUBLIC_SANITY_*` vars and `SANITY_API_WRITE_TOKEN`

## Code Style (Biome Enforced)

- **Tabs** for indentation, **single quotes**, **semicolons**
- **TypeScript strict mode**: Explicit types, avoid `any`, use `import type { ... }`
- **Path alias**: `@/` maps to `src/`
- **File naming**: PascalCase for components, camelCase for utils
- **JSDoc required**: Document all exported functions (no `@example` blocks)
- **No console.log**: Use `console.error` for errors only

## Component Patterns

**Sections**: Server Components that accept props matching their schema + optional `searchParams`

```tsx
export default function HeroSection({ heading, paragraph, image }: HeroSectionProps) {
  return <Section>{/* content */}</Section>
}
```

**Section wrapper**: Use `<Section>` from `src/components/utility/Section.tsx` for consistent padding via `PADDING_CONFIG`

**Images**: Use `SmartImage` component for Sanity images with auto blurhash placeholders and CDN optimization

## Schema Design Patterns

**Conditional visibility**: Use `hidden: ({ parent }) => !!parent?.otherField` to show/hide fields
**Orderable lists**: Use `@sanity/orderable-document-list` for drag-drop ordering (see Studio desk structure)
**Preview configs**: Always include helpful `preview` with `select` and `prepare` for Studio UX

## Integration Points

- **Sanity CDN**: Images served via `cdn.sanity.io` (configured in `next.config.ts`)
- **Draft mode**: API route at `app/api/draft-mode/enable/route.ts` for preview
- **Vercel deployment**: Auto-deploys schema via postinstall script when `VERCEL_ENV=production`
- **Presentation tool**: Live preview configured with `locations` for page/post navigation

## Critical Files

- `src/lib/sections.ts`: Section registry (must match schema `_type` names)
- `src/sanity/schema/index.ts`: Schema entry point (export all types)
- `src/config/index.ts`: Padding config and protected route patterns
- `src/types/sections.ts`: TypeScript types for section props

## When Adding Features

1. **New section**: Follow 5-step registry pattern above
2. **New document type**: Add to schema, update queries, add to Studio desk structure if needed
3. **New link type**: Extend `defineLink()` constructor and update `SmartLink` resolver
4. **Environment changes**: Update both README and `.env.local` template
