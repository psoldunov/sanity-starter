import {
	defineLocations,
	type PresentationPluginOptions,
} from 'sanity/presentation';

export const resolve: PresentationPluginOptions['resolve'] = {
	locations: {
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
	},
};
