import type { ElementType } from 'react';
import sections from '@/lib/sections';
import type { SectionProps } from '@/types/sections';

function SectionComponent(_type: keyof typeof sections): ElementType {
	return sections[_type];
}

export function SectionRenderer({
	section,
	searchParams,
}: {
	section: SectionProps;
	searchParams?: { [key: string]: string | string[] | undefined };
}) {
	const { _type } = section;

	if (_type === undefined) {
		throw new Error(
			'Section _type is undefined. Ensure the section fragment exists in the SECTIONS_FRAGMENTS.',
		);
	}

	if (!(_type in sections)) {
		console.warn(`Section type "${_type}" is not registered.`);
		return null;
	}

	const Renderer = SectionComponent(_type as keyof typeof sections);

	return <Renderer {...section} searchParams={searchParams} />;
}
