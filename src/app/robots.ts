import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/url';
import { sanityFetch } from '@/sanity/lib/live';
import { PAGES_QUERY } from '@/sanity/lib/queries';

export default async function robots(): Promise<MetadataRoute.Robots> {
	const baseUrl = getSiteUrl();

	const { data: pages } = await sanityFetch({
		query: PAGES_QUERY,
		stega: false,
		perspective: 'published',
	});

	const withSlug = pages.flatMap((page) => {
		const current = page.route?.current;
		return current ? [{ current, noIndex: page.noIndex }] : [];
	});

	return {
		rules: {
			userAgent: '*',
			disallow: withSlug.filter((p) => p.noIndex).map((p) => p.current),
			allow: [
				...withSlug.filter((p) => !p.noIndex).map((p) => p.current),
				'/posts/*',
			],
		},
		sitemap: `${baseUrl}/sitemap.xml`,
	};
}
