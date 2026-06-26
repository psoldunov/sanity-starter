'use client';

import { Select, Stack, Text } from '@sanity/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	FormField,
	type StringInputProps,
	set,
	unset,
	useDocumentStore,
	useFormValue,
} from 'sanity';
import { apiVersion } from '@/sanity/env';

type SectionIdCandidate = {
	id?: unknown;
	_type?: unknown;
	_key?: unknown;
};

function extractSectionIds(sections: SectionIdCandidate[]): string[] {
	return sections
		.filter((section): section is { id: string } => {
			return (
				typeof section === 'object' &&
				section !== null &&
				'id' in section &&
				typeof section.id === 'string' &&
				section.id.trim() !== ''
			);
		})
		.map((section) => section.id);
}

export default function SectionIdInput(props: StringInputProps) {
	const { id, value, onChange, path } = props;
	const parentPath = path.slice(0, -1);
	const parent = useFormValue(parentPath) as
		| { page?: { reference?: { _ref?: string } } }
		| undefined;
	const pageRef = parent?.page?.reference;
	const currentPageRef = pageRef?._ref;
	const documentStore = useDocumentStore();
	const [sectionIds, setSectionIds] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	// Whether the referenced document is a `page`. Section anchors only apply to
	// pages, so for any other linkable type (e.g. `post`) the field is hidden.
	// Optimistic default avoids a flash for the common page case; a non-page ref
	// instead shows the control briefly until its `_type` resolves below.
	const [isPage, setIsPage] = useState(true);
	const previousPageRef = useRef<string | undefined>(undefined);

	// Track the latest value in a ref so the subscription effect below can read
	// it without listing `value` as a dependency — otherwise the live query
	// listener would be torn down and rebuilt on every selection.
	const valueRef = useRef(value);
	valueRef.current = value;

	const clearSectionId = useCallback(() => {
		if (valueRef.current) {
			onChange(unset());
		}
	}, [onChange]);

	useEffect(() => {
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
		setIsPage(true);
		setLoading(true);

		// `listenQuery` with the `drafts` perspective mirrors the editor's live
		// state, so section IDs added but not yet published still appear. The
		// query resolves the draft id when one exists, else the published id.
		// `_type` is selected so non-page destinations (e.g. posts) can hide the
		// field — section anchors only resolve for pages.
		const subscription = documentStore
			.listenQuery(
				`*[_id in [$pageId, "drafts." + $pageId]]
					| order(_id desc)[0]{
						_type,
						sections[]{ id, _type, _key }
					}`,
				{ pageId: currentPageRef },
				{ perspective: 'drafts', apiVersion },
			)
			.subscribe({
				next: (
					doc: { _type?: string; sections?: SectionIdCandidate[] } | null,
				) => {
					const referencedIsPage = doc?._type === 'page';
					setIsPage(referencedIsPage);

					const ids =
						referencedIsPage && Array.isArray(doc?.sections)
							? extractSectionIds(doc.sections)
							: [];
					setSectionIds(ids);
					setLoading(false);

					// Drop a stale anchor when the destination is no longer a page or
					// the chosen section no longer exists.
					if (valueRef.current && !ids.includes(valueRef.current)) {
						clearSectionId();
					}
				},
				error: (error: unknown) => {
					console.error('Error fetching section IDs:', error);
					setSectionIds([]);
					setLoading(false);
				},
			});

		return () => {
			subscription.unsubscribe();
		};
	}, [currentPageRef, clearSectionId, documentStore]);

	const options = useMemo(
		() => [
			{ value: '', title: '-' },
			...sectionIds.map((id) => ({ value: id, title: id })),
		],
		[sectionIds],
	);

	if (!pageRef?._ref || !isPage) {
		return null;
	}

	return (
		<FormField
			title='Section ID'
			description='Anchor to a section on the linked page'
			inputId={id}
		>
			<Stack space={2}>
				<Select
					id={id}
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
		</FormField>
	);
}
