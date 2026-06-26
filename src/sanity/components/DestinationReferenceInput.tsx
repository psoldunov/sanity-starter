'use client';

import { CloseIcon } from '@sanity/icons';
import {
	Autocomplete,
	Badge,
	Box,
	Button,
	Card,
	Flex,
	Stack,
	Text,
} from '@sanity/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { type ObjectInputProps, set, unset, useDocumentStore } from 'sanity';
import { LINKABLE_DOCUMENTS, STATIC_ROUTES } from '@/config/linkables';
import { apiVersion } from '@/sanity/env';
import type { InternalDestinationValue } from '@/types';

/**
 * A selectable destination row, normalised across linkable documents and static
 * routes so the picker can render and resolve them uniformly.
 */
type DestinationOption = {
	/** Unique option key: document `_id` for docs, path for static routes. */
	value: string;
	kind: 'document' | 'static';
	title: string;
	subtitle: string;
	typeLabel: string;
};

const LINKABLE_TYPE_PARAMS = [
	'page',
	...LINKABLE_DOCUMENTS.map((document) => document.type),
];

const titleSelect = [
	'_type == "page" => coalesce(title, "Untitled Page")',
	...LINKABLE_DOCUMENTS.map(
		(document) =>
			`_type == "${document.type}" => coalesce(${document.titleField}, "Untitled ${document.label}")`,
	),
].join(',\n');

const subtitleSelect = [
	'_type == "page" => coalesce(route.current, "No route")',
	...LINKABLE_DOCUMENTS.map(
		(document) =>
			`_type == "${document.type}" => coalesce("${document.basePath}/" + ${document.slugField}, "No route")`,
	),
].join(',\n');

/**
 * Upper bound on documents pulled into the picker. The picker loads matching
 * documents once and filters them client-side (see `filterOption`), so this
 * caps memory/transfer rather than paginating. Adequate for the small content
 * sets a starter deals with; swap to a server-side search if a linkable type
 * grows past this.
 */
const MAX_DESTINATION_OPTIONS = 1000;

const typeLabelSelect = [
	'_type == "page" => "Page"',
	...LINKABLE_DOCUMENTS.map(
		(document) => `_type == "${document.type}" => "${document.label}"`,
	),
].join(',\n');

const DESTINATION_QUERY = `*[_type in $types]|order(_type asc, orderRank asc){
	"value": _id,
	"kind": "document",
	"title": select(${titleSelect}),
	"subtitle": select(${subtitleSelect}),
	"typeLabel": select(${typeLabelSelect})
}[0...${MAX_DESTINATION_OPTIONS}]`;

/**
 * Static-route options derived from config. Constant — they never change at
 * runtime, so they are computed once and merged with the live document options.
 */
const STATIC_OPTIONS: DestinationOption[] = STATIC_ROUTES.map((route) => ({
	value: route.path,
	kind: 'static',
	title: route.label,
	subtitle: route.path,
	typeLabel: 'Static',
}));

/**
 * Renders a single option row mirroring Studio's native reference results: a
 * title, a muted subtitle and a type badge.
 *
 * @param option - The destination option to render.
 * @returns The option row element.
 */
function renderDestinationOption(option: DestinationOption) {
	return (
		<Card as='button' padding={3} radius={2}>
			<Flex align='center' gap={3}>
				<Stack flex={1} space={2}>
					<Text size={1} weight='medium' textOverflow='ellipsis'>
						{option.title}
					</Text>
					<Text size={1} muted textOverflow='ellipsis'>
						{option.subtitle}
					</Text>
				</Stack>
				<Badge tone='primary' fontSize={0}>
					{option.typeLabel}
				</Badge>
			</Flex>
		</Card>
	);
}

/**
 * Universal picker for an `internalDestination` object. Replaces Studio's
 * default object form with an ordered, native-looking search over pages, every
 * configured linkable document type and static Next routes. Writes either a
 * document `reference` or a `staticPath` depending on the selection.
 *
 * @param props - Standard Sanity object input props for `internalDestination`.
 * @returns The destination picker input.
 */
export default function DestinationReferenceInput(
	props: ObjectInputProps<InternalDestinationValue>,
) {
	const { id, value, onChange } = props;
	const currentRef = value?.reference?._ref;
	const currentPath = value?.staticPath;
	const documentStore = useDocumentStore();
	const [documentOptions, setDocumentOptions] = useState<DestinationOption[]>(
		[],
	);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// `listenQuery` re-emits the full result whenever a matching document
		// changes, so reordering pages/projects in Structure updates the picker
		// live. `drafts` perspective mirrors what the Structure desk shows.
		const subscription = documentStore
			.listenQuery(
				DESTINATION_QUERY,
				{ types: LINKABLE_TYPE_PARAMS },
				{ perspective: 'drafts', apiVersion },
			)
			.subscribe({
				next: (result: DestinationOption[]) => {
					setDocumentOptions(result ?? []);
					setLoading(false);
				},
				error: (error: unknown) => {
					console.error('Error watching link destinations:', error);
					setDocumentOptions([]);
					setLoading(false);
				},
			});

		return () => {
			subscription.unsubscribe();
		};
	}, [documentStore]);

	const options = useMemo(
		() => [...documentOptions, ...STATIC_OPTIONS],
		[documentOptions],
	);

	const selected = useMemo(() => {
		if (currentRef) {
			return options.find(
				(option) => option.kind === 'document' && option.value === currentRef,
			);
		}
		if (currentPath) {
			return (
				options.find(
					(option) => option.kind === 'static' && option.value === currentPath,
				) ?? {
					value: currentPath,
					kind: 'static' as const,
					title: currentPath,
					subtitle: currentPath,
					typeLabel: 'Static',
				}
			);
		}
		return undefined;
	}, [options, currentRef, currentPath]);

	const handleSelect = useCallback(
		(nextValue: string) => {
			const option = options.find((candidate) => candidate.value === nextValue);

			if (!option) {
				onChange(unset());
				return;
			}

			if (option.kind === 'static') {
				onChange(
					set({ _type: 'internalDestination', staticPath: option.value }),
				);
				return;
			}

			onChange(
				set({
					_type: 'internalDestination',
					reference: { _type: 'reference', _ref: option.value },
				}),
			);
		},
		[options, onChange],
	);

	const handleClear = useCallback(() => {
		onChange(unset());
	}, [onChange]);

	const filterOption = useCallback(
		(query: string, option: DestinationOption) => {
			const haystack = `${option.title} ${option.subtitle}`.toLowerCase();
			return haystack.includes(query.toLowerCase());
		},
		[],
	);

	if (currentRef || currentPath) {
		return (
			<Card border padding={2} radius={2}>
				<Flex align='center' gap={2}>
					<Box flex={1} paddingLeft={1}>
						{selected ? (
							<Stack space={2}>
								<Flex align='center' gap={2}>
									<Text size={1} weight='medium' textOverflow='ellipsis'>
										{selected.title}
									</Text>
									<Badge tone='primary' fontSize={0}>
										{selected.typeLabel}
									</Badge>
								</Flex>
								<Text size={1} muted textOverflow='ellipsis'>
									{selected.subtitle}
								</Text>
							</Stack>
						) : (
							<Text size={1} muted>
								{loading ? 'Loading destination…' : 'Unknown destination'}
							</Text>
						)}
					</Box>
					<Button
						mode='bleed'
						icon={CloseIcon}
						onClick={handleClear}
						title='Clear destination'
						aria-label='Clear destination'
						fontSize={1}
						padding={2}
					/>
				</Flex>
			</Card>
		);
	}

	return (
		<Autocomplete<DestinationOption>
			id={id || 'internal-destination'}
			options={options}
			value=''
			loading={loading}
			openButton
			openOnFocus
			placeholder='Search pages, posts and routes…'
			filterOption={filterOption}
			renderOption={renderDestinationOption}
			onSelect={handleSelect}
		/>
	);
}
