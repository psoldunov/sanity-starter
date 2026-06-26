import { LinkIcon as SanityLinkIcon } from '@sanity/icons';
import { FileIcon, HashIcon, LinkIcon, PaperclipIcon } from 'lucide-react';
import { defineField, defineType } from 'sanity';
import { hasDestination } from '@/lib/links';
import SectionIdField from '@/sanity/components/SectionIdField';
import SectionIdInput from '@/sanity/components/SectionIdInput';

const sharedFields = [
	defineField({
		// Field key kept as `page` for content back-compat; it now holds an
		// `internalDestination` (page, post or static route), not just a page.
		name: 'page',
		title: 'Internal destination',
		description: 'Link to a page, post or static route',
		type: 'internalDestination',
		hidden: ({ parent }) => !!parent?.href || !!parent?.file,
	}),
	defineField({
		name: 'sectionId',
		type: 'string',
		title: 'Section ID',
		// Label and description are rendered by `SectionIdInput` via `FormField`
		// so they hide together with the control. `SectionIdField` strips the
		// default chrome to avoid rendering them twice.
		components: {
			field: SectionIdField,
			input: SectionIdInput,
		},
		// Only document references can have section anchors; static routes and
		// empty destinations never do. The input further hides itself (chrome
		// included) for non-page references (e.g. posts).
		hidden: ({ parent }) => !parent?.page?.reference?._ref,
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
		hidden: ({ parent }) => hasDestination(parent?.page) || !!parent?.file,
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
		hidden: ({ parent }) => hasDestination(parent?.page) || !!parent?.href,
	}),
];

const sharedPreview = {
	select: {
		pageRoute: 'page.reference.route.current',
		referenceSlug: 'page.reference.slug.current',
		staticPath: 'page.staticPath',
		sectionId: 'sectionId',
		fileName: 'file.asset.originalFilename',
		href: 'href',
	},
	prepare({
		pageRoute,
		referenceSlug,
		staticPath,
		sectionId,
		href,
		fileName,
		label,
	}: {
		pageRoute?: string;
		referenceSlug?: string;
		staticPath?: string;
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
			: staticPath
				? { media: LinkIcon, subtitle: staticPath }
				: referenceSlug
					? { media: FileIcon, subtitle: referenceSlug }
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
