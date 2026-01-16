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

## Tech Stack

- **Package Manager**: Bun (exclusively)
- **Framework**: Next.js 16.1.1
- **React**: 19.2.3 (Server Components by default)
- **TypeScript**: 5.9.3 (strict mode)
- **CMS**: Sanity (next-sanity 12.0.5)
- **Deployment**: Vercel (assumed platform, uses Vercel global environment variables)
- **Styling**: Tailwind CSS 4.1.18
- **State Management**: Jotai 2.16.1
- **Icons**: Lucide React 0.562.0, React Icons 5.5.0
- **Linting/Formatting**: Biome 2.3.8
- **Sanity Plugins**: 
  - `@sanity/orderable-document-list` - Drag-and-drop reordering for documents
  - `sanity-plugin-media` - Enhanced media management

## Prerequisites

- Node.js 18+ (recommended: latest LTS)
- [Bun](https://bun.sh) (this project uses bun exclusively)
- A Sanity project (create one at [sanity.io](https://www.sanity.io))
- **Vercel account** (this project is optimized for Vercel deployment and uses Vercel's global environment variables)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd sanity-starter
```

### 2. Install Dependencies

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
│       └── SmartLink.tsx
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
│   └── sections.ts
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

**Adding New Sections:**

1. Create a section schema in `src/sanity/schema/objects/sections/` using `defineSection()`
2. Create a section component in `src/components/sections/`
3. Register the section in `src/sanity/schema/objects/sections/index.ts`
4. Add the section to the registry in `src/lib/sections.ts`
5. Add the section type to `src/types/sections.ts`
6. Add a GROQ fragment in `src/sanity/lib/queries/fragments.ts` to `SECTIONS_FRAGMENTS` array

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

## Development

### Available Scripts

```bash
# Start development server
bun dev

# Build for production
bun run build

# Start production server
bun start

# Lint code
bun run lint

# Format code
bun run format
```

**Postinstall Script:**

The project includes a `postinstall` script that automatically uploads the Sanity schema to your Sanity project during deployment. When deployed to Vercel in production (`VERCEL_ENV=production`), the script runs automatically after `bun install` to:
- Deploy the latest schema to Sanity (`sanity schema deploy`)
- Extract the manifest for the Studio (`sanity manifest extract`)

This ensures your Sanity Studio always has the latest schema definitions in production. For local development, you can manually run `sanity schema deploy` if needed.

### Code Style

This project uses:
- **Biome** for linting and formatting
- **TypeScript** strict mode
- **Tabs** for indentation
- **Single quotes** for strings
- **Path aliases** (`@/` for `src/`)

See `.cursorrules` for detailed coding guidelines.

### TypeScript

The project uses strict TypeScript. All types are defined in `src/types/`. When adding new content types:

1. Add the type definition to `src/types/index.ts` or a dedicated file
2. Update Sanity queries to match the type structure
3. Ensure schema definitions match the types

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

1. **Create Schema** (`src/sanity/schema/objects/sections/mySection.ts`):
```typescript
import defineSection from '@/sanity/schema/constructors/defineSection';
import { MyIcon } from 'lucide-react';

export default defineSection({
  name: 'mySection',
  title: 'My Section',
  icon: MyIcon,
  fields: [
    // Your custom fields
  ],
  preview: {
    select: {
      // Preview configuration
    },
  },
});
```

2. **Create Component** (`src/components/sections/MySection.tsx`):
```typescript
export default function MySection({ ...props }: MySectionProps) {
  return (
    <Section {...props}>
      {/* Your section content */}
    </Section>
  );
}
```

3. **Register Schema** in `src/sanity/schema/objects/sections/index.ts`:
```typescript
import mySection from './mySection';
const sectionTypes = [..., mySection];
```

4. **Register Component** in `src/lib/sections.ts`:
```typescript
import MySection from '@/components/sections/MySection';
const sections = {
  ...,
  mySection: MySection,
};
```

5. **Add Type** to `src/types/sections.ts`:
```typescript
export type MySectionProps = BaseSectionProps & {
  _type: 'mySection';
  // Your section fields
};
export type SectionProps = ... | MySectionProps;
```

6. **Add Query Fragment** in `src/sanity/lib/queries/fragments.ts` to the `SECTIONS_FRAGMENTS` array:
```groq
export const SECTIONS_FRAGMENTS = [
  ...,
  `_type == "mySection" => {
    _type,
    _key,
    // Your section fields
  }`,
];
```

### Styling

The project uses Tailwind CSS. Customize:
- Colors and theme in `tailwind.config.ts`
- Global styles in `src/styles/globals.css`
- Component styles using Tailwind classes

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

1. Follow the code style guidelines in `.cursorrules`
2. Add JSDoc comments to exported functions (no examples)
3. Use TypeScript strictly (no `any` without good reason)
4. Test your changes thoroughly
5. Update documentation as needed

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
