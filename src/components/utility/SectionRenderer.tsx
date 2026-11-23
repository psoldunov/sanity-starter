import type { ElementType } from 'react';
import { SECTION_COMPONENTS } from '@/sections/components.generated';
import type { SectionData } from '@/types';

export type { SectionData };

/**
 * Renders one page-builder section by looking its `_type` up in the registry.
 *
 * An unknown or missing `_type` skips the section rather than throwing. Editors
 * can save a section whose folder has not reached this deployment yet,
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

	if (!_type || !(_type in SECTION_COMPONENTS)) {
		if (process.env.NODE_ENV !== 'production') {
			console.error(
				`SectionRenderer: no component registered for section type "${_type ?? 'undefined'}". Add a src/sections/${_type ?? '<name>'}/ folder and run "bun run sections:gen".`,
			);
		}
		return null;
	}

	const Renderer = SECTION_COMPONENTS[
		_type as keyof typeof SECTION_COMPONENTS
	] as ElementType;

	return (
		<Renderer
			{...section}
			searchParams={searchParams}
			isFirstSection={isFirstSection}
		/>
	);
}
