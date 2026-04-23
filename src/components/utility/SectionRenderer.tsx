import type { ElementType } from 'react';
import sections from '@/lib/sections';
import type { PAGE_QUERY_RESULT } from '@/sanity/types/sanity.types';

export type SectionData = NonNullable<PAGE_QUERY_RESULT>['sections'][number];

export function SectionRenderer({
	section,
	searchParams,
}: {
	section: SectionData;
	searchParams?: { [key: string]: string | string[] | undefined };
}) {
	const { _type } = section;

	if (_type === undefined) {
		throw new Error(
			'Section _type is undefined. Ensure the section fragment exists in PAGE_QUERY.',
		);
	}

	if (!(_type in sections)) {
		return null;
	}

	const Renderer = sections[_type as keyof typeof sections] as ElementType;

	return <Renderer {...section} searchParams={searchParams} />;
}
