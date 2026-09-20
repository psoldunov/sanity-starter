import type { ElementType } from 'react';
import sections from '@/lib/sections';
import type { SectionData } from '@/types';

export type { SectionData };

/**
 * Renders one page-builder section by looking its `_type` up in the registry.
 *
 * An unknown or missing `_type` skips the section rather than throwing. Editors
 * can save a section whose GROQ fragment has not been added to `PAGE_QUERY` yet,
 * and one such section should not take the whole route down with a 500.
 *
 * @param props.section - The section object from `PAGE_QUERY`.
 * @param props.searchParams - Search params, forwarded to dynamic sections only.
 * @param props.isFirstSection - Whether this is the page's first section. A
 *   section that renders the page's LCP image reads it to decide whether to
 *   preload: only the first placement can be above the fold, and preloading
 *   several candidates prioritises none of them.
 * @returns The section component, or `null` when the type is not registered.
 */
export function SectionRenderer({
	section,
	searchParams,
	isFirstSection,
}: {
	section: SectionData;
	searchParams?: { [key: string]: string | string[] | undefined };
	isFirstSection?: boolean;
}) {
	const { _type } = section;

	if (!_type || !(_type in sections)) {
		if (process.env.NODE_ENV !== 'production') {
			console.error(
				`SectionRenderer: no component registered for section type "${_type ?? 'undefined'}". Register it in src/lib/sections.ts and add its fragment to PAGE_QUERY.`,
			);
		}
		return null;
	}

	const Renderer = sections[_type as keyof typeof sections] as ElementType;

	return (
		<Renderer
			{...section}
			searchParams={searchParams}
			isFirstSection={isFirstSection}
		/>
	);
}
