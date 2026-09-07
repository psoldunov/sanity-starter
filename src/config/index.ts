import { LINKABLE_DOCUMENTS, STATIC_ROUTES } from '@/config/linkables';
import type { PaddingSize } from '@/types';

export const PADDING_CONFIG: Record<
	PaddingSize,
	{
		label: string;
		classes: {
			top: string;
			bottom: string;
		};
	}
> = {
	none: {
		label: '-',
		classes: {
			top: '',
			bottom: '',
		},
	},
	small: {
		label: 'SM',
		classes: {
			top: 'pt-4 md:pt-8',
			bottom: 'pb-4 md:pb-8',
		},
	},
	medium: {
		label: 'MD',
		classes: {
			top: 'pt-8 md:pt-16',
			bottom: 'pb-8 md:pb-16',
		},
	},
	large: {
		label: 'LG',
		classes: {
			top: 'pt-12 md:pt-24',
			bottom: 'pb-12 md:pb-24',
		},
	},
	xlarge: {
		label: 'XL',
		classes: {
			top: 'pt-16 md:pt-32',
			bottom: 'pb-16 md:pb-32',
		},
	},
};

/**
 * Paths owned by the application rather than by the CMS, and therefore not
 * available for a `page` document to claim as its route.
 *
 * Derived from both registries in `@/config/linkables` rather than hand-listed:
 *
 * - `LINKABLE_DOCUMENTS` base paths, so `/posts/*` is reserved and a page cannot
 *   silently shadow `/posts/hello`.
 * - `STATIC_ROUTES` paths, so a page cannot shadow a route that Next implements
 *   directly — `/posts` itself, and whatever an adopter adds next.
 *
 * Registering a route in either list therefore reserves it, instead of leaving
 * the lists to drift apart until a collision surfaces in production.
 */
export const PROTECTED_ROUTE_PATTERNS: readonly string[] = [
	'/api/*',
	'/admin/*',
	...LINKABLE_DOCUMENTS.map((document) => `${document.basePath}/*`),
	...STATIC_ROUTES.map((route) => route.path),
];

/**
 * Paths excluded from crawling in `robots.txt`.
 *
 * Deliberately narrower than `PROTECTED_ROUTE_PATTERNS`: `/posts/*` is reserved
 * against CMS pages but is public content that should absolutely be indexed.
 */
export const CRAWLER_DISALLOWED_PATHS: readonly string[] = ['/api/', '/admin/'];
