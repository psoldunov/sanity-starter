import { LinkIcon } from '@sanity/icons';
import { defineField, defineType } from 'sanity';
import { LINKABLE_DOCUMENTS } from '@/config/linkables';
import DestinationField from '@/sanity/components/DestinationField';
import DestinationReferenceInput from '@/sanity/components/DestinationReferenceInput';

/**
 * Reference targets for an internal destination: pages plus every configured
 * linkable document type.
 */
const referenceTargets = [
	{ type: 'page' },
	...LINKABLE_DOCUMENTS.map((document) => ({ type: document.type })),
];

/**
 * Polymorphic internal destination. Holds EITHER a `reference` to a linkable
 * Sanity document (page or a configured type) OR a `staticPath` pointing at a
 * Next route that has no backing document. The custom picker writes one or the
 * other; consumers resolve a URL via `resolveDestinationUrl`.
 */
export const internalDestination = defineType({
	name: 'internalDestination',
	title: 'Destination',
	type: 'object',
	icon: LinkIcon,
	components: {
		field: DestinationField,
		input: DestinationReferenceInput,
	},
	fields: [
		defineField({
			name: 'reference',
			title: 'Document',
			description: 'A page or post to link to',
			type: 'reference',
			to: referenceTargets,
			options: {
				disableNew: true,
			},
		}),
		defineField({
			name: 'staticPath',
			title: 'Static route',
			description: 'A Next route with no backing document, e.g. /contact',
			type: 'string',
		}),
	],
	preview: {
		select: {
			pageRoute: 'reference.route.current',
			referenceSlug: 'reference.slug.current',
			staticPath: 'staticPath',
		},
		prepare({ pageRoute, referenceSlug, staticPath }) {
			return {
				title: staticPath ?? pageRoute ?? referenceSlug ?? 'No destination',
			};
		},
	},
});
