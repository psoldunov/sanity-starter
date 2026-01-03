import { LinkIcon } from 'lucide-react';
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
		icon: LinkIcon,
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
				options: {
					disableNew: true,
				},
				hidden: ({ parent }) => !!parent?.url || !!parent?.file,
			},
			{
				name: 'sectionId',
				type: 'string',
				title: 'Section ID',
				components: {
					input: SectionIdInput,
				},
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
				hidden: ({ parent }) => !!parent?.page || !!parent?.file,
			},
			{
				name: 'file',
				type: 'file',
				title: 'File',
				options: {
					accept:
						'application/pdf, application/zip, application/msword, text/plain',
				},
				hidden: ({ parent }) => !!parent?.page || !!parent?.url,
			},
		],
		preview: {
			select: {
				label: 'label',
				pageRoute: 'page.route.current',
				sectionId: 'sectionId',
				fileName: 'file.asset.originalFilename',
				url: 'url',
			},
			prepare({ label, pageRoute, sectionId, url, fileName }) {
				return {
					title: label || 'Link',
					subtitle: pageRoute
						? `${pageRoute}${sectionId ? `#${sectionId}` : ''}`
						: url
							? url
							: fileName
								? fileName
								: 'No URL selected',
				};
			},
		},
	});
}
