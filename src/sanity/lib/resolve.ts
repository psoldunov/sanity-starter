import { defineDocuments, defineLocations } from 'sanity/presentation';
import { documentPath } from '@/lib/links';

export const locations = {
	page: defineLocations({
		select: {
			title: 'title',
			route: 'route',
		},
		resolve: (doc) => ({
			locations: [
				{
					title: doc?.title,
					href: doc?.route?.current,
				},
			],
		}),
	}),
	post: defineLocations({
		select: {
			title: 'title',
			slug: 'slug',
		},
		// A draft post has no slug until the title generates one, and
		// `documentPath` returns the index path for an empty slug — so an
		// unguarded location would have that draft claim `/posts` as its own
		// and highlight the blog index. No slug, no location.
		resolve: (doc) => ({
			locations: doc?.slug?.current
				? [{ title: doc.title, href: documentPath('post', doc.slug.current) }]
				: [],
		}),
	}),
};

export const mainDocuments = defineDocuments([
	{
		route: '/posts/:slug',
		filter: `_type == "post" && slug.current == $slug`,
	},
	{
		route: '{:slug(.*)}',
		filter: `_type == "page" && route.current == $slug`,
	},
]);
