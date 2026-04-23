import { LinkIcon as SanityLinkIcon } from '@sanity/icons';
import { FileIcon, HashIcon, LinkIcon, PaperclipIcon } from 'lucide-react';
import { defineField, defineType } from 'sanity';
import SectionIdInput from '@/sanity/components/SectionIdInput';

const sharedFields = [
	defineField({
		name: 'page',
		title: 'Page',
		type: 'reference',
		to: [{ type: 'page' }],
		options: {
			disableNew: true,
		},
		hidden: ({ parent }) => !!parent?.href || !!parent?.file,
	}),
	defineField({
		name: 'sectionId',
		type: 'string',
		title: 'Section ID',
		components: {
			input: SectionIdInput,
		},
		hidden: ({ parent }) => !parent?.page,
	}),
	defineField({
		name: 'href',
		type: 'url',
		title: 'URL',
		validation: (rule) =>
			rule.uri({
				scheme: ['http', 'https', 'mailto', 'tel'],
				allowRelative: true,
			}),
		hidden: ({ parent }) => !!parent?.page || !!parent?.file,
	}),
	defineField({
		name: 'rel',
		type: 'string',
		title: 'rel',
		description: 'The rel attribute for the link',
		options: {
			list: [
				{ title: 'noopener', value: 'noopener' },
				{ title: 'noopener noreferrer', value: 'noopener noreferrer' },
			],
		},
		hidden: ({ parent }) => !parent?.href?.startsWith('http'),
	}),
	defineField({
		name: 'file',
		type: 'file',
		title: 'File',
		options: {
			accept:
				'application/pdf, application/zip, application/msword, text/plain',
		},
		hidden: ({ parent }) => !!parent?.page || !!parent?.href,
	}),
];

const sharedPreview = {
	select: {
		pageRoute: 'page.route.current',
		sectionId: 'sectionId',
		fileName: 'file.asset.originalFilename',
		href: 'href',
	},
	prepare({
		pageRoute,
		sectionId,
		href,
		fileName,
		label,
	}: {
		pageRoute?: string;
		sectionId?: string;
		href?: string;
		fileName?: string;
		label?: string;
	}) {
		const variant = pageRoute
			? {
					media: FileIcon,
					subtitle: `${pageRoute}${sectionId ? `#${sectionId}` : ''}`,
				}
			: href
				? { media: LinkIcon, subtitle: href }
				: fileName
					? { media: PaperclipIcon, subtitle: fileName }
					: { media: HashIcon, subtitle: 'No URL selected' };

		return {
			title: label || 'Link',
			...variant,
		};
	},
};

export const link = defineType({
	name: 'link',
	title: 'Link',
	type: 'object',
	icon: SanityLinkIcon,
	fields: sharedFields,
	preview: sharedPreview,
});

export const linkWithLabel = defineType({
	name: 'linkWithLabel',
	title: 'Link',
	type: 'object',
	icon: SanityLinkIcon,
	fields: [
		defineField({
			name: 'label',
			title: 'Label',
			type: 'string',
		}),
		...sharedFields,
	],
	preview: {
		select: {
			...sharedPreview.select,
			label: 'label',
		},
		prepare: sharedPreview.prepare,
	},
});
