# Adding a section

A page is an ordered array of sections, each one a Sanity object type with a
matching React component. Adding a new one is seven mechanical steps. Miss one
and the failure is quiet: the section saves in the Studio but renders nothing.

The worked example below builds a **CTA Section** — a heading, a paragraph and
a link — end to end.

## The seven steps

1. Schema in `src/sanity/schema/objects/sections/<name>Section.ts`, built with
   `defineSection()`.
2. Register it in `src/sanity/schema/objects/sections/index.ts`.
3. Add its GROQ fragment to `src/sanity/lib/fragments.ts`.
4. Interpolate that fragment into `PAGE_QUERY` in
   `src/sanity/lib/queries/index.ts`.
5. Component in `src/components/sections/<Name>Section.tsx`, default export,
   PascalCase filename matching `_type`.
6. Register the component in `src/lib/sections.ts`.
7. `bun run typegen`.

Step 8, only if the section reads `searchParams`: add its `_type` to
`DYNAMIC_SECTION_TYPES` in [`src/config/sections.ts`](../src/config/sections.ts).

## 1. Schema

`src/sanity/schema/objects/sections/ctaSection.ts`:

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

**Do not export a GROQ fragment from this file.** Fragments live in
`src/sanity/lib/fragments.ts` — step 3 explains why.

`defineSection()`
([source](../src/sanity/schema/constructors/defineSection.ts)) adds, in a
**Configuration** field group, to every section:

| Field | Type | Purpose |
| --- | --- | --- |
| `padding.top` / `padding.bottom` | `string` | One of `none`, `small`, `medium`, `large`, `xlarge`; rendered by `<Section>` from `PADDING_CONFIG`. Suppress with `disablePadding: true`. |
| `id` | `string` | Anchor id, so links can target `#section-id`. |
| `hidden` | `boolean` | Omits the section from the live site; dimmed rather than removed in draft mode. |

Your own fields go into a **Content** group automatically.

## 2. Register the schema

`src/sanity/schema/objects/sections/index.ts`:

```ts
import cardsSection from './cardsSection';
import ctaSection from './ctaSection';
import heroSection from './heroSection';
import imageTextSection from './imageTextSection';

const sectionTypes = [heroSection, cardsSection, imageTextSection, ctaSection];

export default sectionTypes;
```

The `page` document builds its `sections` array from `sectionTypes`, so the new
type appears in the Studio insert menu as soon as it is in that list.

## 3. Add the fragment

`src/sanity/lib/fragments.ts`:

```ts
export const CTA_SECTION_FRAGMENT = `
	_type == "ctaSection" => {
		...,
		link {
			...,
			page ${INTERNAL_DESTINATION_PROJECTION}
		},
	}`;
```

Two rules govern that file, and both are load-bearing:

- **It must never import anything.** Fragments used to sit beside their schema
  definitions, which meant `src/sanity/lib/queries` — and through it
  `robots.ts`, `sitemap.ts` and every page — transitively imported
  `defineSection`, and through *that* the entire `sanity` Studio runtime. The
  whole Studio ended up in the public server and client bundles, and under Next
  16's `react-server` condition it failed the build outright: `sanity` reaches
  `swr`, which has no default export under that condition. Keeping every
  fragment in an import-free module is what keeps the Studio out of the site.
- **Every fragment must be a plain template literal constant.** Sanity TypeGen
  statically resolves `${CONST}` references only when the referent is a string
  literal — a function call or a `.join()` there silently produces untyped
  results.

Two projection details:

- **Links** must project their destination with
  `INTERNAL_DESTINATION_PROJECTION` (defined at the top of the same file). A
  bare `page->` returns a reference the resolver cannot use.
- **Images** need `image { ..., asset-> }`, otherwise `SmartImage` gets an
  unresolved reference and loses blurhash and intrinsic dimensions. See
  `HERO_SECTION_FRAGMENT` in the same file.

## 4. Add the fragment to `PAGE_QUERY`

`src/sanity/lib/queries/index.ts`:

```ts
import {
	CARDS_SECTION_FRAGMENT,
	CTA_SECTION_FRAGMENT,
	HERO_SECTION_FRAGMENT,
	IMAGE_TEXT_SECTION_FRAGMENT,
	INTERNAL_DESTINATION_PROJECTION,
} from '@/sanity/lib/fragments';

export const PAGE_QUERY =
	defineQuery(`*[_type == "page" && route.current == $slug][0]{
  _id,
  title,
  "route": route.current,
  metaTitle,
  metaDescription,
  noIndex,
  ogImage,
  sections[] {
    ...,
    ${HERO_SECTION_FRAGMENT},
    ${CARDS_SECTION_FRAGMENT},
    ${IMAGE_TEXT_SECTION_FRAGMENT},
    ${CTA_SECTION_FRAGMENT}
  }
}`);
```

Skipping this step is the most common mistake. The section still saves and still
comes back from `sections[] { ... }`, but its references and image assets are
never dereferenced, so the generated union has no variant for it and
`SectionProps<'ctaSection'>` will not compile.

## 5. The component

`src/components/sections/CtaSection.tsx`:

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
- **Type props with `SectionProps<'<name>Section'>`**, never by hand. The helper
  extracts the matching variant of the generated, stega-branded union.
- **Server Component by default.** Add `'use client'` only if the section needs
  browser APIs, and push it as far down the tree as you can.
- **Guard optional fields.** Sanity content is user-entered; `!!heading &&` is
  the house style.

## 6. Register the component

`src/lib/sections.ts`:

```ts
import CardsSection from '@/components/sections/CardsSection';
import CtaSection from '@/components/sections/CtaSection';
import HeroSection from '@/components/sections/HeroSection';
import ImageTextSection from '@/components/sections/ImageTextSection';

const sections = {
	heroSection: HeroSection,
	cardsSection: CardsSection,
	imageTextSection: ImageTextSection,
	ctaSection: CtaSection,
};

export default sections;
```

Keys must match `_type` exactly. `SectionRenderer` looks the component up by the
`_type` that comes back from `PAGE_QUERY`; an unregistered type renders nothing
and logs in development:

```
SectionRenderer: no component registered for section type "ctaSection". Register it in src/lib/sections.ts and add its fragment to PAGE_QUERY.
```

## 7. Regenerate types

```bash
bun run typegen
```

`bun dev` and `bun run build` both do this first, so restarting the dev server
is equivalent. After it runs, `PAGE_QUERY_RESULT.sections` carries a
`ctaSection` variant and `SectionProps<'ctaSection'>` resolves.

## Sections that read search params

A section needing `searchParams` (a filter, a paginated list) must declare
itself, because the catch-all page only awaits `searchParams` when a page
actually contains one — awaiting it unconditionally would make every page
dynamic.

```ts
// src/config/sections.ts
export const DYNAMIC_SECTION_TYPES: readonly string[] = ['filteredListSection'];
```

That list lives in `src/config/` rather than next to the component registry for
the same reason fragments live in `src/sanity/lib/fragments.ts`:
`src/lib/sections.ts` imports every section component, so reading the list from
there would pull React and the whole component graph into `src/lib/slug.ts` and
into anything that tests it.

`SectionRenderer` forwards `searchParams` to every section; only the declared
ones receive a populated object.

## Checklist

- [ ] Schema file exists and uses `defineSection()`
- [ ] Added to `sectionTypes` in the sections index
- [ ] Fragment added to `src/sanity/lib/fragments.ts` as a plain string constant
- [ ] That file still imports nothing
- [ ] Fragment interpolated into `PAGE_QUERY`
- [ ] Component created, props spread into `<Section>`
- [ ] Registered in `src/lib/sections.ts` under the exact `_type`
- [ ] `bun run typegen` run, `bun run check` passes
- [ ] Added to `DYNAMIC_SECTION_TYPES` if it reads `searchParams`

Related: [architecture](./architecture.md) · [links](./links.md) ·
[performance](./performance.md)
