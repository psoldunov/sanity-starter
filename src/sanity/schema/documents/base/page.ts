import { orderRankField } from '@sanity/orderable-document-list';
import { FileIcon } from 'lucide-react';
import { defineType } from 'sanity';
import { validatePageRoute } from '@/sanity/lib/validations';
import sectionTypes from '@/sanity/schema/objects/sections';

const page = defineType({
	name: 'page',
	title: 'Page',
	type: 'document',
	icon: FileIcon,
	groups: [
		{
			name: 'general',
			title: 'General',
		},
		{
			name: 'content',
			title: 'Content',
		},
		{
			name: 'seo',
			title: 'SEO & Metadata',
		},
	],
	fields: [
		{
			name: 'title',
			title: 'Title',
			type: 'string',
			group: 'general',
		},
		{
			name: 'route',
			title: 'Route',
			description: 'The URL of the page (e.g. /about)',
			type: 'slug',
			group: 'general',
			validation: (rule) => rule.custom(validatePageRoute),
		},
		{
			name: 'sections',
			title: 'Sections',
			type: 'array',
			group: 'content',
			of: sectionTypes.map((section) => ({
				type: section.name,
			})),
			validation: (rule) =>
				rule.required().min(1).error('At least one section is required'),
			options: {
				insertMenu: {
					filter: true,
					views: [
						// {
						//   name: "grid",
						//   previewImageUrl: (schemaTypeName) =>
						//     `/static/${schemaTypeName}.png`,
						// },
						{ name: 'list' },
					],
				},
			},
		},
		{
			name: 'metaTitle',
			title: 'Meta Title',
			type: 'string',
			group: 'seo',
			description: 'The title to use for the SEO metadata',
		},
		{
			name: 'metaDescription',
			description: 'The description to use for the SEO metadata',
			title: 'Meta Description',
			group: 'seo',
			type: 'text',
		},
		{
			name: 'ogImage',
			title: 'Open Graph Image',
			description: 'The image to use for the Open Graph previews',
			type: 'image',
			group: 'seo',
			options: {
				accept: 'image/webp, image/png, image/jpeg, image/avif',
			},
		},
		{
			name: 'noIndex',
			title: 'Hide from search engines',
			type: 'boolean',
			group: 'seo',
			description: 'Prevent search engines from indexing this page',
			initialValue: false,
			validation: (rule) => rule.required(),
		},
		orderRankField({ type: 'page' }),
	],
	preview: {
		select: {
			title: 'title',
			route: 'route',
		},
		prepare({ title, route }) {
			return {
				title: title || 'Untitled Page',
				subtitle: route?.current || 'No route',
			};
		},
	},
});

export default page;
