import { orderRankField } from '@sanity/orderable-document-list';
import { ShuffleIcon } from 'lucide-react';
import { defineType } from 'sanity';
import { hasDestination } from '@/lib/links';
import { validateRedirectRoute } from '@/sanity/lib/validations';
import type { InternalDestinationValue } from '@/types';

const redirect = defineType({
	name: 'redirect',
	title: 'Redirect',
	type: 'document',
	icon: ShuffleIcon,
	fields: [
		{
			name: 'route',
			title: 'Route',
			description: 'The source route to redirect from',
			type: 'slug',
			validation: (rule) => rule.custom(validateRedirectRoute),
		},
		{
			name: 'destination',
			title: 'Destination',
			description: 'The page, post or static route to redirect to',
			type: 'internalDestination',
			validation: (rule) =>
				rule.custom((value: InternalDestinationValue | undefined) =>
					hasDestination(value) ? true : 'Destination is required',
				),
		},
		orderRankField({ type: 'redirect' }),
	],
	preview: {
		select: {
			route: 'route',
			destinationRoute: 'destination.reference.route.current',
			destinationSlug: 'destination.reference.slug.current',
			staticPath: 'destination.staticPath',
		},
		prepare({ route, destinationRoute, destinationSlug, staticPath }) {
			const destination =
				staticPath || destinationRoute || destinationSlug || 'No destination';

			return {
				title: route?.current || 'No route',
				subtitle: `-> ${destination}`,
			};
		},
	},
});

export default redirect;
