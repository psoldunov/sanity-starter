import { defineField } from 'sanity';
import SectionIdInput from '@/sanity/components/SectionIdInput';

/**
 * Defines a Sanity link field with support for page references, section IDs, and external URLs.
 * The field automatically shows/hides relevant inputs based on the selected link type.
 * When a page is selected, users can optionally link to a specific section within that page.
 *
 * @param withLabel - Whether to include a label field for the link text (default: false)
 * @param name - The field name/identifier (default: 'link')
 * @param title - The display title for the field (default: 'Link')
 * @returns A Sanity field definition for a link object type
 */
export default function defineLink({
	withLabel = false,
	name = 'link',
	title = 'Link',
}: {
	withLabel?: boolean;
	name?: string;
	title?: string;
}) {
	return defineField({
		name,
		title,
		type: 'object',
		fields: [
			...(withLabel
				? [
						{
							name: 'label',
							title: 'Label',
							type: 'string',
						},
					]
				: []),
			{
				name: 'page',
				title: 'Page',
				type: 'reference',
				to: [{ type: 'page' }],
				description: 'The page to link to',
				options: {
					disableNew: true,
				},
				hidden: ({ parent }) => !!parent?.url,
			},
			{
				name: 'sectionId',
				type: 'string',
				title: 'Section ID',
				components: {
					input: SectionIdInput,
				},
				description: 'The ID of the section to link to',
				hidden: ({ parent }) => !parent?.page,
			},
			{
				name: 'url',
				type: 'url',
				title: 'URL',
				validation: (rule) =>
					rule.uri({
						scheme: ['http', 'https', 'mailto', 'tel'],
						allowRelative: true,
					}),
				hidden: ({ parent }) => !!parent?.page,
			},
		],
		preview: {
			select: {
				label: 'label',
				pageRoute: 'page.route.current',
				sectionId: 'sectionId',
				url: 'url',
			},
			prepare({ label, pageRoute, sectionId, url }) {
				return {
					title: label || 'Link',
					subtitle: pageRoute
						? `${pageRoute}${sectionId ? `#${sectionId}` : ''}`
						: url
							? url
							: 'No link',
				};
			},
		},
	});
}
