import { orderRankField } from '@sanity/orderable-document-list';
import { ShuffleIcon } from 'lucide-react';
import { defineType } from 'sanity';
import { validateRedirectRoute } from '@/sanity/lib/validations';

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
			type: 'reference',
			to: [{ type: 'page' }],
			options: {
				disableNew: true,
			},
			validation: (rule) => rule.required().error('Destination is required'),
		},
		orderRankField({ type: 'redirect' }),
	],
	preview: {
		select: {
			route: 'route',
			destinationRoute: 'destination.route',
		},
		prepare({ route, destinationRoute }) {
			return {
				title: route?.current || 'No route',
				subtitle: `-> ${destinationRoute?.current || 'No destination'}`,
			};
		},
	},
});

export default redirect;
