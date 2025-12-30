import { Select, Stack, Text } from '@sanity/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type StringInputProps, set, unset, useFormValue } from 'sanity';
import { client } from '@/sanity/lib/client';
import type { SectionProps } from '@/types/sections';

function extractSectionIds(sections: SectionProps[]): string[] {
	return sections
		.filter((section): section is SectionProps => {
			return (
				typeof section === 'object' &&
				section !== null &&
				'id' in section &&
				typeof (section as SectionProps).id === 'string' &&
				(section as SectionProps).id?.trim() !== ''
			);
		})
		.map((section) => section.id as string);
}

export default function SectionIdInput(props: StringInputProps) {
	const { value, onChange, path } = props;
	const parentPath = path.slice(0, -1);
	const parent = useFormValue(parentPath) as
		| { page?: { _ref?: string } }
		| undefined;
	const pageRef = parent?.page;
	const [sectionIds, setSectionIds] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	const previousPageRef = useRef<string | undefined>(undefined);

	const clearSectionId = useCallback(() => {
		if (value) {
			onChange(unset());
		}
	}, [value, onChange]);

	useEffect(() => {
		const currentPageRef = pageRef?._ref;
		const pageChanged =
			previousPageRef.current !== undefined &&
			previousPageRef.current !== currentPageRef;

		if (pageChanged) {
			clearSectionId();
		}

		if (!currentPageRef) {
			setSectionIds([]);
			previousPageRef.current = undefined;
			return;
		}

		previousPageRef.current = currentPageRef;

		async function fetchSectionIds() {
			setLoading(true);
			try {
				const page = await client.fetch(
					`*[_type == "page" && _id == $pageId][0] {
						sections[] {
							id,
							_type,
							_key
						}
					}`,
					{ pageId: currentPageRef },
				);

				if (page?.sections && Array.isArray(page.sections)) {
					const ids = extractSectionIds(page.sections);
					setSectionIds(ids);

					if (value && !ids.includes(value)) {
						clearSectionId();
					}
				} else {
					setSectionIds([]);
					clearSectionId();
				}
			} catch (error) {
				console.error('Error fetching section IDs:', error);
				setSectionIds([]);
				clearSectionId();
			} finally {
				setLoading(false);
			}
		}

		fetchSectionIds();
	}, [pageRef?._ref, clearSectionId, value]);

	const options = useMemo(
		() => [
			{ value: '', title: '-' },
			...sectionIds.map((id) => ({ value: id, title: id })),
		],
		[sectionIds],
	);

	if (!pageRef?._ref) {
		return null;
	}

	return (
		<Stack space={2}>
			<Select
				value={value || ''}
				onChange={(event) => {
					const nextValue = event.currentTarget.value;
					onChange(nextValue ? set(nextValue) : unset());
				}}
				disabled={loading}
			>
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.title}
					</option>
				))}
			</Select>
			{loading && (
				<Text size={1} muted>
					Loading section IDs...
				</Text>
			)}
			{!loading && sectionIds.length === 0 && (
				<Text size={1} muted>
					No section IDs found for this page.
				</Text>
			)}
		</Stack>
	);
}
