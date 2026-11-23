# Adding a section

A page is an ordered array of sections, each one a Sanity object type with a
matching React component. Each section lives in its own folder under
[`src/sections/`](../src/sections), and the folder name is the schema `_type`.
You create the folder and run a generator. No shared file is edited by hand.

The worked example below builds a **CTA Section**: a heading, a paragraph and a
link.

## What a section folder holds

`src/sections/ctaSection/`:

| File | Required | Holds |
| --- | --- | --- |
| `schema.ts` | yes | Default export of `defineSection({...})`. |
| `fragment.ts` | yes | `export const fragment`, the GROQ projection. |
| `CtaSection.tsx` | yes | Default-export component, PascalCase of the folder name. |
| `markdown.ts` | yes | Default-export serializer that renders the section as Markdown. |
| `config.ts` | no | `{ dynamic?, order? }`: search-param use and Studio menu position. |

The folder name must be camelCase and match the schema `name`, for example
`heroSection`. `bun run sections:gen` rejects a folder with a wrong name or a
missing required file.

## 1. Schema

`src/sections/ctaSection/schema.ts`:

```ts
import { MegaphoneIcon } from 'lucide-react';
import defineLink from '@/sanity/schema/constructors/defineLink';
import defineSection from '@/sanity/schema/constructors/defineSection';

const ctaSection = defineSection({
	name: 'ctaSection',
	title: 'CTA Section',
	icon: MegaphoneIcon,
	fields: [
		{
			type: 'string',
			name: 'heading',
			title: 'Heading',
			description: 'Headline shown above the call to action',
			validation: (rule) => rule.required(),
		},
		{
			type: 'text',
			name: 'paragraph',
			title: 'Paragraph',
			description: 'Supporting copy under the heading',
		},
		{
			...defineLink({ withLabel: true }),
			name: 'link',
			title: 'Button',
			description: 'Where the call-to-action button points',
		},
	],
	preview: {
		select: { heading: 'heading', paragraph: 'paragraph' },
		prepare({ heading, paragraph }) {
			return {
				title: heading || 'CTA Section',
				subtitle: paragraph || undefined,
			};
		},
	},
});

export default ctaSection;
```

**Do not put the GROQ fragment in this file.** It goes in `fragment.ts`, and the
reason is in step 2.

`defineSection()`
([source](../src/sanity/schema/constructors/defineSection.ts)) adds, in a
**Configuration** field group, to every section:

| Field | Type | Purpose |
| --- | --- | --- |
| `padding.top` / `padding.bottom` | `string` | One of `none`, `small`, `medium`, `large`, `xlarge`; rendered by `<Section>` from `PADDING_CONFIG`. Suppress with `disablePadding: true`. |
| `id` | `string` | Anchor id, so links can target `#section-id`. |
| `hidden` | `boolean` | Omits the section from the live site; dimmed rather than removed in draft mode. |

Your own fields go into a **Content** group automatically.

## 2. Fragment

`src/sections/ctaSection/fragment.ts`:

```ts
import { INTERNAL_DESTINATION_PROJECTION } from '@/sanity/lib/fragments';

export const fragment = `
	_type == "ctaSection" => {
		...,
		link {
			...,
			page ${INTERNAL_DESTINATION_PROJECTION}
		},
	}`;
```

Two rules apply, and both are load-bearing:

- **Import only from `@/sanity/lib/fragments`.** Fragments used to sit beside
  their schema definitions, which meant `src/sanity/lib/queries`, and through it
  `robots.ts`, `sitemap.ts` and every page, imported `defineSection` and then the
  entire `sanity` Studio runtime. The whole Studio ended up in the public server
  and client bundles, and under Next 16's `react-server` condition it failed the
  build outright: `sanity` reaches `swr`, which has no default export under that
  condition. [`src/sanity/lib/fragments.ts`](../src/sanity/lib/fragments.ts)
  imports nothing, so a fragment that imports only from it keeps the Studio out
  of the site. Do not import the schema, a component or `sanity` here.
- **The fragment must be a plain template literal constant.** Sanity TypeGen
  statically resolves `${CONST}` references only when the referent is a string
  literal. A function call or a `.join()` silently produces untyped results.

Two projection details:

- **Links** must project their destination with
  `INTERNAL_DESTINATION_PROJECTION`. A bare `page->` returns a reference the
  resolver cannot use.
- **Images** need `image { ..., asset-> }`, otherwise `SmartImage` gets an
  unresolved reference and loses its LQIP placeholder and intrinsic dimensions.
  See [`src/sections/heroSection/fragment.ts`](../src/sections/heroSection/fragment.ts).

## 3. The component

`src/sections/ctaSection/CtaSection.tsx`:

```tsx
import Container from '@/components/layout/Container';
import Section from '@/components/utility/Section';
import SmartLink from '@/components/utility/SmartLink';
import type { SectionProps } from '@/types';

export default function CtaSection(props: SectionProps<'ctaSection'>) {
	const { heading, paragraph, link } = props;

	return (
		<Section {...props}>
			<Container className='max-w-2xl text-center'>
				{!!heading && (
					<h2 className='text-balance font-semibold text-3xl text-foreground tracking-tight sm:text-4xl'>
						{heading}
					</h2>
				)}
				{!!paragraph && (
					<p className='mt-4 text-lg text-muted leading-relaxed'>{paragraph}</p>
				)}
				{!!link && (
					<SmartLink
						link={link}
						className='mt-8 inline-flex h-10 items-center rounded-theme bg-accent px-4 font-medium text-accent-foreground text-sm'
					/>
				)}
			</Container>
		</Section>
	);
}
```

Rules that are not optional:

- **Spread the whole props object into `<Section>`.** `padding`, `id` and
  `hidden` live on those props; destructuring only your own fields and passing
  nothing through silently breaks all three.
- **Type props with `SectionProps<'<name>'>`**, never by hand. The helper
  extracts the matching variant of the generated, stega-branded union.
- **Server Component by default.** Add `'use client'` only if the section needs
  browser APIs, and push it as far down the tree as you can.
- **Guard optional fields.** Sanity content is user-entered; `!!heading &&` is
  the house style.

## 4. The Markdown serializer

`src/sections/ctaSection/markdown.ts`:

```ts
import { blocks, heading, linkTo, prose } from '@/lib/markdown/format';
import { linkUrl } from '@/lib/markdown/links';
import type { SectionSerializer } from '@/lib/markdown/sections';

/**
 * Markdown for `ctaSection`: the heading, the copy, then the link.
 *
 * @param section - The section, read without stega.
 * @param context - The site URL, for absolute links.
 * @returns The section as Markdown.
 */
const ctaSectionMarkdown: SectionSerializer<'ctaSection'> = (
	section,
	context,
) => {
	const url = linkUrl(section.link, context.siteUrl);

	return blocks(
		heading(2, section.heading),
		prose(section.paragraph),
		url ? linkTo(section.link?.label || url, url) : '',
	);
};

export default ctaSectionMarkdown;
```

A serializer is a `(section, context) => string` function typed with
`SectionSerializer<'<name>'>` from `@/lib/markdown/sections`. It writes what the
page shows, in the order it shows it, from the query data rather than the
rendered HTML. Use the helpers in
[`src/lib/markdown/format.ts`](../src/lib/markdown/format.ts) (`blocks`,
`heading`, `prose`, `bulletList`, `linkTo`) and make links absolute with
`linkUrl`. The heading level follows the page outline: the hero heading is `#`,
other sections open at `##` and items inside them use `###`. Keep the file free
of React, components and the Sanity client. The rules and the reasoning are in
[LLM layer](./llm.md).

## 5. Optional config

`src/sections/ctaSection/config.ts`:

```ts
import type { SectionConfig } from '@/types';

const config: SectionConfig = { order: 50 };

export default config;
```

| Key | Effect |
| --- | --- |
| `order` | Position in the Studio insert menu, lowest first. Sections without one follow, sorted by name. The four starter sections use 10, 20, 30 and 40. |
| `dynamic` | The section reads `searchParams`. See below. |

`config.ts` must have no runtime imports (`import type` is fine). The generator
loads it with Bun on its own, outside the Next.js build.

## 6. Generate the registries and types

```bash
bun run sections:gen
bun run typegen
```

`sections:gen` ([`scripts/sections-gen.ts`](../scripts/sections-gen.ts)) scans
`src/sections/*/`, validates each folder and writes deterministic, gitignored
files next to the folders:

| Generated file | Exports | Used by |
| --- | --- | --- |
| `src/sections/schemas.generated.ts` | `sectionTypes` | [`src/sanity/schema/index.ts`](../src/sanity/schema/index.ts) and the `page` document's `sections` array |
| `src/sections/fragments.generated.ts` | `SECTION_FRAGMENTS` | `${SECTION_FRAGMENTS}` in `PAGE_QUERY` |
| `src/sections/components.generated.ts` | `SECTION_COMPONENTS` | `SectionRenderer` |
| `src/sections/serializers.generated.ts` | `SECTION_SERIALIZERS`, typed `SectionSerializers` | `sectionToMarkdown` in [`src/lib/markdown/sections.ts`](../src/lib/markdown/sections.ts), the Markdown rendering of a page |
| `src/sections/dynamic.generated.ts` | `DYNAMIC_SECTION_TYPES` | `hasDynamicParams` in [`src/lib/slug.ts`](../src/lib/slug.ts) |

`fragments.generated.ts` imports each fragment through a small
`<name>.fragment.generated.ts` file. Sanity TypeGen resolves an import by its
local name only, so `import { fragment as x }` would fail, and TypeGen still
exits 0 with a warning.

`bun run typegen` runs `sections:gen` first, so `bun dev`, the production build,
`bun run typecheck` and the postinstall script all pick up a new folder without
a separate step. After `typegen`, `PAGE_QUERY_RESULT.sections` carries a
`ctaSection` variant and `SectionProps<'ctaSection'>` resolves.

An unregistered `_type` renders nothing and logs in development:

```
SectionRenderer: no component registered for section type "ctaSection". Add a src/sections/ctaSection/ folder and run "bun run sections:gen".
```

## Sections that read search params

A section needing `searchParams` (a filter, a paginated list) sets
`dynamic: true` in its `config.ts`, because the catch-all page only awaits
`searchParams` when a page actually contains one. Awaiting it unconditionally
would make every page dynamic.

```ts
// src/sections/filteredListSection/config.ts
import type { SectionConfig } from '@/types';

const config: SectionConfig = { dynamic: true };

export default config;
```

The generator collects those flags into `DYNAMIC_SECTION_TYPES`, a literal array
that imports nothing. `src/lib/slug.ts` reads it without pulling React or the
component graph in, and neither does anything that tests `slug.ts`.

`SectionRenderer` forwards `searchParams` to every section; only the declared
ones receive a populated object.

## Checklist

- [ ] Folder `src/sections/<name>/` named after the camelCase `_type`
- [ ] `schema.ts` uses `defineSection()`
- [ ] `fragment.ts` is a plain template literal and imports only from `@/sanity/lib/fragments`
- [ ] Component created, props spread into `<Section>`
- [ ] `markdown.ts` serializes the content
- [ ] `config.ts` sets `dynamic: true` if the section reads `searchParams`
- [ ] `bun run sections:gen` and `bun run typegen` run, `bun run check` passes

Related: [architecture](./architecture.md) · [links](./links.md) ·
[LLM layer](./llm.md) · [performance](./performance.md)
