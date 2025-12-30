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
};

export const mainDocuments = defineDocuments([
	{
		route: '{:slug(.*)}',
		filter: `_type == "page" && route.current == $slug`,
	},
]);
