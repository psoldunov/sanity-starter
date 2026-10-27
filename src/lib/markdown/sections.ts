import { isDereferencedAsset, resolveAltText } from '@/lib/image';
import {
	blocks,
	heading,
	image,
	prose,
	type Text,
} from '@/lib/markdown/format';
import type { PublishedSection, PublishedSectionData } from '@/types';

/*
 * One markdown serializer per section `_type`.
 *
 * Each writes what its component shows, in the order it shows it, from the
 * section data rather than the rendered HTML. That keeps the copy clean: no
 * Tailwind wrappers, no button labels stranded on a line of their own, and no
 * design-only text a model would read as content.
 *
 * Heading levels follow the page, not the component: a hero's heading is the
 * page's `#`, every other section opens at `##`, and items inside a section
 * sit at `###`. A model reads the outline, so keep it honest.
 *
 * This module tree (`src/lib/markdown/`) stays free of React, components and
 * the Sanity client — the same rule `src/config/sections.ts` follows — so the
 * route handlers and the tests import it without dragging either in.
 */

type SectionType = PublishedSectionData['_type'];

/** What a serializer may need besides its section. */
export type MarkdownContext = {
	/** The site origin, without a trailing slash, for absolute links. */
	siteUrl: string;
};

type SectionSerializer<T extends SectionType> = (
	section: PublishedSection<T>,
	context: MarkdownContext,
) => string;

/** An image field as `PAGE_QUERY` projects it: `asset->` dereferenced. */
type ImageField = {
	asset?: unknown;
	caption?: Text;
} | null;

/**
 * An image as markdown, with the alt text `SmartImage` would render.
 *
 * @param field - The image field.
 * @returns The image, or an empty string when it has no alt text or asset.
 */
function sectionImage(field: ImageField | undefined): string {
	const asset = field?.asset;
	if (!isDereferencedAsset(asset)) return '';

	const alt = resolveAltText({
		altText: asset.altText,
		caption: field?.caption,
	});
	return image(alt, asset.url);
}

/**
 * The serializer for every section `_type`. A mapped type over the union, so
 * a section added to `PAGE_QUERY` without an entry here fails typecheck —
 * which is the point: a section with no serializer is a section agents never
 * see.
 */
const SECTION_SERIALIZERS: { [T in SectionType]: SectionSerializer<T> } = {
	heroSection: (section) =>
		blocks(
			heading(1, section.heading),
			prose(section.paragraph),
			sectionImage(section.image),
		),

	cardsSection: (section) =>
		blocks(
			heading(2, section.heading),
			(section.cards ?? []).map((card) =>
				blocks(heading(3, card.heading), prose(card.paragraph)),
			),
		),

	imageTextSection: (section) =>
		blocks(
			heading(2, section.heading),
			prose(section.paragraph),
			sectionImage(section.image),
		),
};

/**
 * One section as markdown.
 *
 * A section whose `_type` has no serializer — only content written outside
 * the Studio, against an older schema, can produce one — is skipped rather
 * than dumped as JSON.
 *
 * @param section - The section, read without stega.
 * @param context - The site URL.
 * @returns The markdown, or an empty string.
 */
export function sectionToMarkdown(
	section: PublishedSectionData,
	context: MarkdownContext,
): string {
	// TypeScript cannot correlate `section._type` with the serializer it picks,
	// so the lookup is widened; the mapped type above is what keeps it honest.
	const serialize = SECTION_SERIALIZERS[section._type] as
		| ((value: PublishedSectionData, context: MarkdownContext) => string)
		| undefined;

	return serialize ? serialize(section, context) : '';
}
