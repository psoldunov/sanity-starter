import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/utils';
import { sanityFetch } from '@/sanity/lib/live';
import { PAGES_QUERY } from '@/sanity/lib/queries';
import type { Page } from '@/types';

export default async function robots(): Promise<MetadataRoute.Robots> {
	const baseUrl = getSiteUrl();

	const { data: pages }: { data: Page[] } = await sanityFetch({
		query: PAGES_QUERY,
		stega: false,
		perspective: 'published',
	});

	return {
		rules: {
			userAgent: '*',
			disallow: pages
				.filter((page) => page.noIndex)
				.map((page) => page.route.current),
			allow: [
				...pages
					.filter((page) => !page.noIndex)
					.map((page) => page.route.current),
				'/posts/*',
			],
		},
		sitemap: `${baseUrl}/sitemap.xml`,
	};
}
