import { SECTION_SERIALIZERS } from '@/sections/serializers.generated';
import type { PublishedSection, PublishedSectionData } from '@/types';

/*
 * One markdown serializer per section `_type`, each in its section folder:
 * `src/sections/<name>/markdown.ts`. `bun run sections:gen` collects them into
 * `SECTION_SERIALIZERS`.
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
 * This module tree (`src/lib/markdown/`) and every `markdown.ts` stay free of
 * React, components and the Sanity client, so the route handlers and the tests
 * import them without dragging either in.
 */

type SectionType = PublishedSectionData['_type'];

/** What a serializer may need besides its section. */
export type MarkdownContext = {
	/** The site origin, without a trailing slash, for absolute links. */
	siteUrl: string;
};

/**
 * The default export of `src/sections/<name>/markdown.ts`.
 *
 * @template T Section `_type`.
 */
export type SectionSerializer<T extends SectionType> = (
	section: PublishedSection<T>,
	context: MarkdownContext,
) => string;

/**
 * The type of `SECTION_SERIALIZERS`: one serializer per section `_type`. A
 * mapped type over the union, so a section whose types are stale or whose
 * `markdown.ts` serializes the wrong `_type` fails typecheck.
 */
export type SectionSerializers = { [T in SectionType]: SectionSerializer<T> };

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
	// so the lookup is widened; the registry's `SectionSerializers` type keeps it honest.
	const serialize = SECTION_SERIALIZERS[section._type] as
		| ((value: PublishedSectionData, context: MarkdownContext) => string)
		| undefined;

	return serialize ? serialize(section, context) : '';
}
