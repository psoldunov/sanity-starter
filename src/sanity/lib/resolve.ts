import { defineDocuments, defineLocations } from 'sanity/presentation';

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
		resolve: (doc) => ({
			locations: [
				{
					title: doc?.title,
					href: `/posts/${doc?.slug.current}`,
				},
			],
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
