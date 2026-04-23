# Sanity Starter

A modern, full-featured starter template for building content-driven websites with Next.js 16, React 19, and Sanity CMS. This starter includes a flexible section-based page builder, smart linking system, and comprehensive content management capabilities.

## About This Project

This project is a ready-to-go boilerplate designed to provide a complete foundation for building page builder functionality within Sanity CMS. The goal is to eliminate the initial setup overhead and provide a production-ready starting point that includes:

- **Pre-configured page builder** with a flexible section-based architecture
- **Smart link system** supporting page references, section anchors, and external URLs
- **Live preview integration** through Sanity's Presentation Tool
- **Optimized development workflow** with TypeScript, modern tooling, and best practices

This boilerplate is intended for use in both personal and professional projects, providing a solid foundation that can be customized and extended based on specific project requirements. All the common patterns, configurations, and integrations are already set up, allowing you to focus on building unique features rather than boilerplate code.

**Contributions and use of this project are welcome by anybody.** Feel free to use it for your own projects, fork it, modify it, and contribute improvements back to the community.

## Features

- 🚀 **Next.js 16** with App Router and React Server Components
- 📝 **Sanity CMS** integration with live preview and draft mode
- 🎨 **Section-based page builder** for flexible content composition
- 🔗 **Smart link system** supporting page references, section anchors, and external URLs
- 🖼️ **Image optimization** with Sanity CDN, Next.js Image, and blurhash support
- 📱 **Responsive design** with Tailwind CSS
- ♿ **Accessibility** built-in with semantic HTML and ARIA attributes
- 🔍 **SEO optimized** with metadata generation and sitemap support
- 🎯 **TypeScript** strict mode for type safety
- 🧹 **Code quality** with Biome for linting and formatting

<!-- AUTO-GENERATED:tech-stack — sourced from package.json -->
## Tech Stack

- **Package Manager**: Bun (exclusively)
- **Toolchain Manager**: mise (recommended, via `mise.toml`, especially on Windows)
- **Framework**: Next.js ^16.2.4
- **React**: ^19.2.5 (Server Components by default)
- **TypeScript**: ^6.0.3 (strict mode)
- **CMS**: Sanity (next-sanity ^12.3.0)
- **Deployment**: Vercel (assumed platform, uses Vercel global environment variables)
- **Styling**: Tailwind CSS ^4.2.4
- **State Management**: Jotai ^2.19.1
- **Icons**: Lucide React ^1.8.0, React Icons ^5.6.0
- **Linting/Formatting**: Biome 2.4.12
- **Sanity Plugins**:
  - `@sanity/orderable-document-list` — drag-and-drop document reordering
  - `sanity-plugin-media` — enhanced media management
<!-- /AUTO-GENERATED:tech-stack -->

## Prerequisites

- Node.js 18+ (recommended: latest LTS)
- [Bun](https://bun.sh) (this project uses bun exclusively)
- [mise](https://mise.jdx.dev/) (recommended, especially on Windows, for managing Node/Bun versions and tools via `mise.toml`)
- A Sanity project (create one at [sanity.io](https://www.sanity.io))
- **Vercel account** (this project is optimized for Vercel deployment and uses Vercel's global environment variables)

## Getting Started

### 1. Create a New Project from This Starter (Recommended)

To scaffold a new project using this starter as a template:

```bash
bun create psoldunov/sanity-starter YOUR_PROJECT_NAME
```

Then:

```bash
cd YOUR_PROJECT_NAME
```

### 2. Clone the Repository (Alternative for Contributors)

```bash
git clone <repository-url>
cd sanity-starter
```

If you are **not** contributing directly to this starter and just want to build your own project, it is recommended to use the `bun create` command above instead, or initialize a new repository from this codebase before making changes.

### 3. Install Dependencies

```bash
bun install
```

**Note:** The `postinstall` script automatically uploads the Sanity schema during Vercel production deployments. For local development, schema changes are reflected immediately in the Studio.

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Sanity Configuration
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2025-12-12
NEXT_PUBLIC_SANITY_API_READ_TOKEN=your-read-token
SANITY_API_WRITE_TOKEN=your-write-token

# Vercel Environment Variables (automatically provided by Vercel)
# These are set automatically when deployed to Vercel, but can be set manually for local testing
VERCEL_PROJECT_PRODUCTION_URL=your-domain.com
VERCEL_ENV=production
```

**Getting Sanity Credentials:**

1. Go to [sanity.io/manage](https://www.sanity.io/manage)
2. Select your project
3. Navigate to **API** → **Tokens**
4. Create a new token with **Read** permissions for `NEXT_PUBLIC_SANITY_API_READ_TOKEN`
5. Create a new token with **Editor** permissions for `SANITY_API_WRITE_TOKEN`

### 4. Run Development Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see your site.

### 5. Access Sanity Studio

Navigate to [http://localhost:3000/admin](http://localhost:3000/admin) to access the Sanity Studio.

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (site)/              # Public site routes
│   │   ├── [[...slug]]/    # Dynamic page routing
│   │   └── posts/           # Blog posts
│   ├── (studio)/            # Sanity Studio routes
│   │   └── admin/          # Studio interface
│   └── api/                 # API routes
│       └── draft-mode/      # Draft mode endpoint
├── components/
│   ├── layout/              # Layout components
│   │   ├── Container.tsx
│   │   ├── Footer.tsx
│   │   └── Header.tsx
│   ├── sections/            # Section components
│   │   ├── CardsSection.tsx
│   │   ├── CTASection.tsx
│   │   ├── HeroSection.tsx
│   │   └── ImageTextSection.tsx
│   └── utility/             # Utility components
│       ├── Section.tsx
│       ├── SectionRenderer.tsx
│       ├── SmartImage.tsx
│       ├── SmartLink.tsx
│       └── Slot.tsx
├── sanity/
│   ├── components/           # Custom Sanity input components
│   │   ├── PaddingInput.tsx
│   │   ├── SectionIdInput.tsx
│   │   └── SectionPreview.tsx
│   ├── lib/                 # Sanity utilities
│   │   ├── client.ts        # Sanity client configuration
│   │   ├── live.ts          # Live preview setup
│   │   ├── queries/         # GROQ queries
│   │   ├── resolve.ts       # Presentation tool resolution
│   │   ├── utils.ts         # Sanity utilities
│   │   └── validations.ts   # Schema validations
│   └── schema/              # Sanity schema definitions
│       ├── constructors/    # Reusable schema constructors
│       │   ├── defineImage.ts
│       │   ├── defineLink.ts
│       │   └── defineSection.ts
│       ├── documents/       # Document types
│       │   ├── base/
│       │   │   ├── page.ts
│       │   │   ├── redirect.ts
│       │   │   └── settings.ts
│       │   └── post.ts
│       └── objects/         # Object types
│           └── sections/    # Section schemas
├── hooks/                   # Custom React hooks
│   └── index.ts
├── lib/                     # Utility functions
│   ├── actions.ts
│   ├── sections.ts
│   ├── state.ts
│   └── utils.ts
├── types/                   # TypeScript type definitions
│   ├── index.ts
└── styles/                  # Global styles
    └── globals.css
```

## Key Concepts

### Section-Based Pages

Pages are composed of reusable sections. Each section can have:
- Custom content fields
- Padding configuration (top/bottom)
- Optional section ID for anchor linking
- Hidden state for temporarily hiding sections without removing them completely

**Available Sections:**
- Hero Section
- Cards Section
- Image Text Section

**Adding New Sections** (see `AGENTS.md` for the authoritative 7-step workflow):

1. Create section schema in `src/sanity/schema/objects/sections/` via `defineSection()`
2. Export a GROQ fragment as a plain template-literal constant (e.g. `MY_SECTION_FRAGMENT`) from the same file
3. Create the component in `src/components/sections/` (PascalCase, matches `_type`). Type props with the `SectionProps<T>` helper from `@/types`, e.g. `props: SectionProps<'mySection'>`
4. Register the schema in `src/sanity/schema/objects/sections/index.ts` — add to `sectionTypes` and re-export the fragment constant
5. Interpolate the fragment directly into `PAGE_QUERY` in `src/sanity/lib/queries/index.ts` via `${MY_SECTION_FRAGMENT}`
6. Register the component in `src/lib/sections.ts` keyed by `_type`
7. Run `bun run typegen` (also runs automatically on `predev` / `prebuild`)

If the section needs `searchParams`, add its `_type` to `dynamicSections` in `src/lib/sections.ts`.

### Smart Links

The smart link system supports four link types:
- **Page Reference**: Link to an internal page
- **Section Anchor**: Link to a specific section within a page (requires page reference)
- **External URL**: Link to external websites, email, or phone numbers
- **File Download**: Link to uploaded files (PDF, ZIP, DOC, TXT)

Links automatically determine the target attribute (`_blank` for external links and file downloads). The `rel` attribute can be configured for external links.

**Important:** When querying links that use `defineLink`, you must dereference the `page` field in your GROQ query to access `page.route`. Example:

```groq
*[_type == "settings"][0] {
  headerMenu[] {
    ...,
    page->
  }
}
```

Without dereferencing (`page->`), you'll only get the reference object (`_ref`, `_type`) and won't have access to `page.route.current`. The dereferenced page object includes the full page document with `route.current` available.

### Sanity Schema Constructors

Reusable schema constructors make it easy to create consistent field definitions:

- `defineSection()`: Creates section schemas with common fields (padding, ID, hidden, groups)
- `defineLink()`: Creates link fields with page/section/URL/file support and optional label
- `defineImage()`: Creates image fields with optimization settings, blurhash, and optional hotspot

### Draft Mode & Live Preview

The project includes full support for Sanity's draft mode and live preview:

- **Draft Mode**: Preview unpublished content
- **Visual Editing**: Edit content directly from the frontend
- **Live Updates**: Real-time content updates via Sanity Live

Access draft mode by enabling it in Sanity Studio or using the preview URL.

### Custom Hooks

The project includes custom React hooks for common client-side functionality:

- **`useIsMainWindow()`**: Checks if the component is running in the main window (not in an iframe and not opened by another window). Returns `false` during SSR and until client-side hydration. Useful for conditionally rendering components only in the main window context (e.g., draft mode controls).

- **`useVerticalScroll()`**: Tracks the current vertical scroll position of the window. Returns the scroll position in pixels. Automatically updates on scroll events.

- **`useViewportSize()`**: Tracks the current viewport size. Returns an object with `width` and `height` properties in pixels. Automatically updates on window resize events.

All hooks are exported from `src/hooks/index.ts` and can be imported as:
```typescript
import { useIsMainWindow, useVerticalScroll, useViewportSize } from '@/hooks';
```

### Slot Component

The project includes a `Slot` utility component at `src/components/utility/Slot.tsx`:

- **Purpose**: Merge props (including `className`) into a single child element, with props passed to `Slot` overriding the child's own props
- **Usage**: Wrap a single React element in `Slot` to forward layout, styling, or behavior props without creating extra DOM wrappers
- **Safety**: Logs an error and returns `null` if no valid single child element is provided

## Development

<!-- AUTO-GENERATED:scripts — sourced from package.json -->
### Available Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server (runs `typegen` first via `predev`) |
| `bun run build` | Production build (runs `typegen` first via `prebuild`) |
| `bun start` | Start production server |
| `bun run lint` | Biome lint check |
| `bun run format` | Biome auto-format |
| `bun run typegen` | Extract Sanity schema + generate TypeScript types |
| `bun run typegen:extract` | Extract schema to `schema.json` |
| `bun run typegen:generate` | Generate `src/sanity/types/sanity.types.ts` from `schema.json` |
<!-- /AUTO-GENERATED:scripts -->

**Postinstall Script:**

`postinstall` (`./scripts/postinstall.sh`) always runs `bun run typegen` to keep generated Sanity types in sync. When `VERCEL_ENV=production`, it additionally:
- Deploys the latest schema to Sanity (`sanity schema deploy`)
- Extracts the manifest for the Studio (`sanity manifest extract`)

Generated artifacts (`schema.json`, `src/sanity/types/sanity.types.ts`) are gitignored and excluded from Biome.

### Code Style

This project uses:
- **Biome** for linting and formatting
- **TypeScript** strict mode
- **Tabs** for indentation
- **Single quotes** for strings
- **Path aliases** (`@/` for `src/`)

See `AGENTS.md` for detailed coding guidelines.

### TypeScript

The project uses strict TypeScript. Section and document shapes are **derived from Sanity TypeGen** — not hand-maintained:

1. Edit the Sanity schema
2. Run `bun run typegen` (or rely on `predev` / `prebuild`)
3. Consume the generated `PAGE_QUERY_RESULT` / document types from `src/sanity/types/sanity.types.ts`

Hand-authored shared types live in `src/types/index.ts`.

## AI Coding Assistants

See `AGENTS.md` for the full agent rulebook (stack, architecture, section registry, schema patterns, code style, do/don't).

When using AI to make changes:

- Use **tabs**, **single quotes**, **semicolons**, and **strict TypeScript**
- Prefer **Server Components**; add `'use client'` only when necessary
- Follow the **Section Creation Workflow** and Sanity query patterns documented in `AGENTS.md`

## Deployment

### Vercel (Recommended)

This project is optimized for Vercel deployment and assumes Vercel as the deployment platform. Vercel automatically provides the following global environment variables:

- `VERCEL_PROJECT_PRODUCTION_URL` - Your production domain
- `VERCEL_ENV` - The deployment environment (production, preview, development)

**Deployment Steps:**

1. Push your code to GitHub/GitLab/Bitbucket
2. Import your repository in [Vercel](https://vercel.com)
3. Add Sanity environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SANITY_PROJECT_ID`
   - `NEXT_PUBLIC_SANITY_DATASET`
   - `NEXT_PUBLIC_SANITY_API_VERSION`
   - `NEXT_PUBLIC_SANITY_API_READ_TOKEN`
   - `SANITY_API_WRITE_TOKEN`
   - `SANITY_AUTH_TOKEN` — **Production only**. Deploy Studio role token used by `sanity schema deploy` + `sanity manifest extract` in `postinstall.sh` so the Sanity Dashboard, Canvas, and Agent Actions can discover the studio. Do **not** set locally — it overrides your personal CLI session.
4. Deploy!

The project automatically uses Vercel's global environment variables (`VERCEL_PROJECT_PRODUCTION_URL` and `VERCEL_ENV`) for production URL detection and site metadata generation.

### Other Platforms

While this project is optimized for Vercel, it can be deployed to other platforms that support Next.js:

1. Set all environment variables (including `VERCEL_PROJECT_PRODUCTION_URL` and `VERCEL_ENV` manually)
2. Run `bun run build`
3. Start the server with `bun start`

**Note:** You'll need to manually set `VERCEL_PROJECT_PRODUCTION_URL` and `VERCEL_ENV` if deploying to a non-Vercel platform.

## Environment Variables

| Variable | Description | Required | Source |
|----------|-------------|----------|--------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Your Sanity project ID | Yes | Manual |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity dataset name (usually `production`) | Yes | Manual |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Sanity API version | Yes | Manual |
| `NEXT_PUBLIC_SANITY_API_READ_TOKEN` | Sanity read token | Yes | Manual |
| `SANITY_API_WRITE_TOKEN` | Sanity write token (for draft mode) | Yes | Manual |
| `SANITY_AUTH_TOKEN` | Sanity deploy-studio token for schema + manifest deploy in CI. **Production only — do not set locally.** | Production only | Manual (Vercel Production env) |
| `VERCEL_PROJECT_PRODUCTION_URL` | Production domain | Yes* | Vercel (automatic) |
| `VERCEL_ENV` | Deployment environment | Yes* | Vercel (automatic) |

\* Automatically provided by Vercel when deployed. Required for production URL detection and metadata generation. Must be set manually for local development or non-Vercel deployments.

## Content Management

### Creating Pages

1. Go to Sanity Studio (`/admin`)
2. Navigate to **Pages**
3. Click **Create new**
4. Fill in:
   - Title
   - Route (URL slug)
   - Sections (add one or more sections)
   - SEO metadata (optional)

### Managing Sections

Sections can be:
- Reordered via drag-and-drop
- Configured with padding (top/bottom)
- Given an ID for anchor linking
- Hidden from display (useful for temporarily hiding sections without removing them completely)

### Settings

The **Settings** document (singleton) contains:
- Site name
- Site description
- Header menu
- Default Open Graph image

## Customization

### Adding New Sections

1. **Create schema + GROQ fragment** (`src/sanity/schema/objects/sections/mySection.ts`):
```typescript
import { MyIcon } from 'lucide-react';
import defineSection from '@/sanity/schema/constructors/defineSection';

export const MY_SECTION_FRAGMENT = `
	_type == "mySection" => {
		...,
		// field projections (e.g. image { ..., asset-> })
	}`;

const mySection = defineSection({
	name: 'mySection',
	title: 'My Section',
	icon: MyIcon,
	fields: [
		// custom fields
	],
	preview: {
		select: {
			// preview configuration
		},
	},
});

export default mySection;
```

> Keep `MY_SECTION_FRAGMENT` a **plain template-literal constant** (no `groq` tag, no function calls, no `.join()`). Sanity TypeGen only statically resolves constant string refs when interpolating into queries.

2. **Register schema + re-export fragment** (`src/sanity/schema/objects/sections/index.ts`):
```typescript
import mySection, { MY_SECTION_FRAGMENT } from './mySection';

export { MY_SECTION_FRAGMENT /* ...other fragments */ };

const sectionTypes = [/* existing */, mySection];
export default sectionTypes;
```

3. **Interpolate into `PAGE_QUERY`** (`src/sanity/lib/queries/index.ts`):
```typescript
export const PAGE_QUERY = defineQuery(`*[_type == "page" && route.current == $slug][0]{
  ...,
  sections[] {
    ...,
    ${HERO_SECTION_FRAGMENT},
    ${MY_SECTION_FRAGMENT},
  }
}`);
```

4. **Create component** (`src/components/sections/MySection.tsx`). Type props via the `SectionProps<T>` helper from `@/types` — do **not** hand-author the shape. The helper resolves to the matching variant of the generated `PAGE_QUERY_RESULT.sections` tagged union, so base fields (`padding`, `id`, `hidden`) and your schema fields stay in sync automatically:
```typescript
import Section from '@/components/utility/Section';
import type { SectionProps } from '@/types';

export default function MySection(props: SectionProps<'mySection'>) {
	const { /* destructure your section-specific fields */ } = props;
	return <Section {...props}>{/* content */}</Section>;
}
```

Spreading `props` into `<Section>` forwards `padding`, `id`, and `hidden` so the wrapper applies them. Destructure schema fields after for use in the body.

5. **Register component** (`src/lib/sections.ts`) — key must match `_type`:
```typescript
import MySection from '@/components/sections/MySection';

const sections = {
	// existing sections...
	mySection: MySection,
};
```

6. **Regenerate types**:
```bash
bun run typegen
```

7. **Optional: dynamic sections** — if the section reads `searchParams`, add its `_type` to `dynamicSections` in `src/lib/sections.ts`.

### Styling

The project uses Tailwind CSS v4 (CSS-first config — no `tailwind.config.ts`). Customize:
- Theme tokens via `@theme` in `src/styles/globals.css`
- Global styles in `src/styles/globals.css`
- Component styles using Tailwind utility classes

## Troubleshooting

### Sanity Studio Not Loading

- Check environment variables are set correctly
- Verify Sanity project ID and dataset match
- Ensure tokens have correct permissions

### Images Not Displaying

- Verify Sanity CDN is enabled for your project
- Check image asset references in queries
- Ensure `remotePatterns` in `next.config.ts` includes `cdn.sanity.io`

### Draft Mode Not Working

- Verify `SANITY_API_WRITE_TOKEN` is set
- Check draft mode API route is accessible
- Ensure token has write permissions

## Contributing

1. Follow the code style guidelines in `AGENTS.md`
2. Add JSDoc comments to exported functions (no `@example` blocks)
3. Use TypeScript strictly (no `any` without good reason)
4. Run `bun run lint` and `bun run format` before committing
5. Keep schema, fragment, and query in sync — regenerate types with `bun run typegen`
6. Update documentation as needed

## License

MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Support

For issues and questions:
- Check existing GitHub issues
- Review Sanity documentation: [sanity.io/docs](https://www.sanity.io/docs)
- Review Next.js documentation: [nextjs.org/docs](https://nextjs.org/docs)

---

Built with ❤️ using Next.js, React, and Sanity CMS
