import { LinkIcon as SanityLinkIcon } from '@sanity/icons';
import { FileIcon, HashIcon, LinkIcon, PaperclipIcon } from 'lucide-react';
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
 * @param group - The group for the field
 * @returns A Sanity field definition for a link object type
 */
export default function defineLink({
	withLabel = false,
	name = 'link',
	title = 'Link',
	group,
}: {
	withLabel?: boolean;
	name?: string;
	title?: string;
	group?: string;
}) {
	return defineField({
		name,
		title,
		icon: SanityLinkIcon,
		type: 'object',
		group,
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
				hidden: ({ parent }) => !!parent?.href || !!parent?.file,
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
				name: 'href',
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
				name: 'rel',
				type: 'string',
				title: 'rel',
				description: 'The rel attribute for the link',
				options: {
					list: [
						{
							title: 'noopener',
							value: 'noopener',
						},
						{
							title: 'noopener noreferrer',
							value: 'noopener noreferrer',
						},
					],
				},
				hidden: ({ parent }) =>
					!parent?.href || !parent.href.startsWith('http'),
			},
			{
				name: 'file',
				type: 'file',
				title: 'File',
				options: {
					accept:
						'application/pdf, application/zip, application/msword, text/plain',
				},
				hidden: ({ parent }) => !!parent?.page || !!parent?.href,
			},
		],
		preview: {
			select: {
				label: 'label',
				pageRoute: 'page.route.current',
				sectionId: 'sectionId',
				fileName: 'file.asset.originalFilename',
				href: 'href',
			},
			prepare({ label, pageRoute, sectionId, href, fileName }) {
				return {
					title: label || 'Link',
					media: pageRoute
						? FileIcon
						: href
							? LinkIcon
							: fileName
								? PaperclipIcon
								: HashIcon,
					subtitle: pageRoute
						? `${pageRoute}${sectionId ? `#${sectionId}` : ''}`
						: href
							? href
							: fileName
								? fileName
								: 'No URL selected',
				};
			},
		},
	});
}
