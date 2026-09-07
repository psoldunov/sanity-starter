import { orderRankField } from '@sanity/orderable-document-list';
import { NewspaperIcon } from 'lucide-react';
import { defineField, defineType } from 'sanity';
import defineImage from '@/sanity/schema/constructors/defineImage';

/**
 * Blog post. Rendered by the templated `/posts` routes rather than the section
 * page builder — the deliberate counterpart to `page`, which is builder-driven.
 *
 * Everything beyond title, slug and content is optional so an existing dataset
 * keeps validating after an upgrade; the templates all degrade gracefully.
 */
const post = defineType({
	name: 'post',
	title: 'Post',
	type: 'document',
	icon: NewspaperIcon,
	groups: [
		{ name: 'general', title: 'General', default: true },
		{ name: 'content', title: 'Content' },
		{ name: 'seo', title: 'SEO & Metadata' },
	],
	fields: [
		defineField({
			type: 'string',
			name: 'title',
			title: 'Title',
			group: 'general',
			description: 'Headline shown on the post page and in listings',
			validation: (rule) => rule.required(),
		}),
		defineField({
			type: 'slug',
			name: 'slug',
			title: 'Slug',
			group: 'general',
			description: 'URL segment under /posts — generated from the title',
			options: { source: 'title', maxLength: 96 },
			validation: (rule) => rule.required(),
		}),
		defineField({
			type: 'datetime',
			name: 'publishedAt',
			title: 'Published at',
			group: 'general',
			description: 'Drives ordering on the blog index and the displayed date',
			initialValue: () => new Date().toISOString(),
		}),
		defineField({
			type: 'text',
			name: 'excerpt',
			title: 'Excerpt',
			group: 'general',
			rows: 3,
			description:
				'Short summary shown in listings and used as a meta fallback',
			validation: (rule) => rule.max(300),
		}),
		defineImage({
			name: 'coverImage',
			title: 'Cover image',
			group: 'general',
			description: 'Shown at the top of the post and in listing cards',
			hotspot: true,
		}),
		defineField({
			type: 'array',
			name: 'content',
			title: 'Content',
			group: 'content',
			description: 'Body of the post',
			of: [
				{ type: 'block' },
				defineImage({
					name: 'contentImage',
					title: 'Image',
					hotspot: true,
					// `PostBody` renders this as a `<figcaption>`, and `SmartImage`
					// falls back to it for alt text. Without the field both are dead.
					fields: [
						defineField({
							type: 'string',
							name: 'caption',
							title: 'Caption',
							description:
								'Shown beneath the image, and used as alt text when the asset has none',
						}),
					],
				}),
			],
			validation: (rule) => rule.required(),
		}),
		defineField({
			type: 'string',
			name: 'metaTitle',
			title: 'Meta Title',
			group: 'seo',
			description: 'Overrides the title in search results and social cards',
		}),
		defineField({
			type: 'text',
			name: 'metaDescription',
			title: 'Meta Description',
			group: 'seo',
			rows: 3,
			description: 'Overrides the excerpt in search results and social cards',
		}),
		defineField({
			name: 'ogImage',
			title: 'Open Graph Image',
			type: 'image',
			group: 'seo',
			description: 'Overrides the cover image for social previews',
			options: { accept: 'image/webp, image/png, image/jpeg, image/avif' },
		}),
		defineField({
			name: 'noIndex',
			title: 'Hide from search engines',
			type: 'boolean',
			group: 'seo',
			description: 'Prevent search engines from indexing this post',
			initialValue: false,
		}),
		orderRankField({ type: 'post' }),
	],
	preview: {
		select: {
			title: 'title',
			slug: 'slug.current',
			publishedAt: 'publishedAt',
			media: 'coverImage',
		},
		prepare({ title, slug, publishedAt, media }) {
			const date = publishedAt
				? new Date(publishedAt).toISOString().slice(0, 10)
				: 'Unscheduled';

			return {
				title: title || 'Untitled Post',
				subtitle: `${date} · /posts/${slug || '…'}`,
				media,
			};
		},
	},
});

export default post;
