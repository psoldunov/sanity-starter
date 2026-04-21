import { SettingsIcon } from 'lucide-react';
import { defineArrayMember, defineField, defineType } from 'sanity';
import defineLink from '../../constructors/defineLink';

const settings = defineType({
	name: 'settings',
	title: 'Site Settings',
	type: 'document',
	icon: SettingsIcon,
	__experimental_formPreviewTitle: false,
	groups: [
		{
			name: 'general',
			title: 'General',
		},
		{
			name: 'navigation',
			title: 'Navigation',
		},
		{
			name: 'seo',
			title: 'SEO & Open Graph',
		},
	],
	fields: [
		{
			name: 'siteName',
			title: 'Site Name',
			group: 'general',
			type: 'string',
			validation: (rule) => rule.required().error('Site Name is required'),
		},
		{
			name: 'siteDescription',
			title: 'Site Description',
			group: 'general',
			type: 'text',
			validation: (rule) =>
				rule.required().error('Site Description is required'),
		},
		{
			name: 'headerMenu',
			title: 'Header Menu',
			type: 'array',
			group: 'navigation',
			of: [defineLink({ withLabel: true })],
			validation: (rule) => rule.required().error('Header Menu is required'),
		},
		defineField({
			name: 'footerNav',
			title: 'Footer Navigation',
			type: 'array',
			group: 'navigation',
			description: 'Columns of links rendered in the site footer',
			of: [
				defineArrayMember({
					name: 'footerNavColumn',
					title: 'Footer Column',
					type: 'object',
					fields: [
						defineField({
							name: 'heading',
							title: 'Heading',
							type: 'string',
							validation: (rule) =>
								rule.required().error('Heading is required'),
						}),
						defineField({
							name: 'links',
							title: 'Links',
							type: 'array',
							of: [defineLink({ withLabel: true })],
							validation: (rule) =>
								rule.required().min(1).error('At least one link is required'),
						}),
					],
					preview: {
						select: { title: 'heading', links: 'links' },
						prepare({ title, links }) {
							const count = Array.isArray(links) ? links.length : 0;
							return {
								title: title || 'Column',
								subtitle: `${count} link${count === 1 ? '' : 's'}`,
							};
						},
					},
				}),
			],
		}),
		{
			name: 'siteOgImage',
			title: 'Open Graph Image',
			type: 'image',
			options: {
				accept: 'image/webp, image/png, image/jpeg, image/avif',
			},
			group: 'seo',
			validation: (rule) =>
				rule.required().error('Open Graph Image is required'),
		},
	],
	preview: {
		prepare() {
			return {
				title: 'Site Settings',
			};
		},
	},
});

export default settings;
