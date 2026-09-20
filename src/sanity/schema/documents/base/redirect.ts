import { orderRankField } from '@sanity/orderable-document-list';
import { ShuffleIcon } from 'lucide-react';
import { defineField, defineType } from 'sanity';
import { hasDestination } from '@/lib/links';
import { validateRedirectRoute } from '@/sanity/lib/validations';
import type { InternalDestinationValue } from '@/types';

const redirect = defineType({
	name: 'redirect',
	title: 'Redirect',
	type: 'document',
	icon: ShuffleIcon,
	fields: [
		defineField({
			name: 'route',
			title: 'Route',
			description:
				'The source route to redirect from. Write it bare, without a trailing /* — Match below decides whether it covers this route alone or everything beneath it, and the list shows it as /route/* once it does.',
			type: 'slug',
			options: {
				// The built-in check is per document type, which would reject an
				// `exact` and a `prefix` rule sharing a route — the legacy index and
				// everything beneath it, which is exactly how `/work` is expressed.
				// `validateRedirectRoute` runs the matchType-aware check instead.
				isUnique: () => true,
			},
			validation: (rule) => rule.custom(validateRedirectRoute),
		}),
		defineField({
			name: 'matchType',
			title: 'Match',
			description:
				'Exact matches this route and nothing else. Prefix matches every route beneath it — "/work" catches /work/kast, but not /work itself, which needs its own redirect.',
			type: 'string',
			initialValue: 'exact',
			options: {
				list: [
					{ title: 'Exact route', value: 'exact' },
					{ title: 'Prefix — everything beneath the route', value: 'prefix' },
				],
				layout: 'dropdown',
			},
			validation: (rule) => rule.required(),
		}),
		defineField({
			name: 'preserveSlug',
			title: 'Keep the rest of the path',
			description:
				'Appends whatever follows the prefix to the destination, so /work/kast lands on /projects/kast. Leave off to send everything beneath the prefix to one page.',
			type: 'boolean',
			initialValue: false,
			hidden: ({ parent }) => parent?.matchType !== 'prefix',
		}),
		defineField({
			name: 'destination',
			title: 'Destination',
			description: 'The page, post or static route to redirect to',
			type: 'internalDestination',
			validation: (rule) =>
				rule.custom((value: InternalDestinationValue | undefined) =>
					hasDestination(value) ? true : 'Destination is required',
				),
		}),
		defineField({
			name: 'statusCode',
			title: 'Status code',
			description:
				'308 tells search engines the move is permanent and passes the old route’s ranking to the destination — the right answer for a retired URL. Use 307 only while a move is genuinely temporary and the old route is coming back.',
			type: 'number',
			initialValue: 308,
			options: {
				list: [
					{ title: '308 — Permanent', value: 308 },
					{ title: '307 — Temporary', value: 307 },
				],
				layout: 'dropdown',
			},
			validation: (rule) => rule.required(),
		}),
		orderRankField({ type: 'redirect' }),
	],
	preview: {
		select: {
			route: 'route',
			matchType: 'matchType',
			preserveSlug: 'preserveSlug',
			statusCode: 'statusCode',
			destinationRoute: 'destination.reference.route.current',
			destinationSlug: 'destination.reference.slug.current',
			staticPath: 'destination.staticPath',
		},
		prepare({
			route,
			matchType,
			preserveSlug,
			statusCode,
			destinationRoute,
			destinationSlug,
			staticPath,
		}) {
			const destination =
				staticPath || destinationRoute || destinationSlug || 'No destination';
			const isPrefix = matchType === 'prefix';
			const source = isPrefix ? `${route?.current ?? ''}/*` : route?.current;
			const target =
				isPrefix && preserveSlug ? `${destination}/*` : destination;

			return {
				title: source || 'No route',
				subtitle: `${statusCode ?? 308} -> ${target}`,
			};
		},
	},
});

export default redirect;
