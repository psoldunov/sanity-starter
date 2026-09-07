import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/url';
import { sanityFetch } from '@/sanity/lib/live';
import { PAGES_SITEMAP_QUERY, POSTS_SITEMAP_QUERY } from '@/sanity/lib/queries';

/**
 * sitemap.xml.
 *
 * Both queries project two fields each and already exclude `noIndex` documents,
 * and they are issued together — they do not depend on each other.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = getSiteUrl();

	const [{ data: pages }, { data: posts }] = await Promise.all([
		sanityFetch({
			query: PAGES_SITEMAP_QUERY,
			stega: false,
			perspective: 'published',
		}),
		sanityFetch({
			query: POSTS_SITEMAP_QUERY,
			stega: false,
			perspective: 'published',
		}),
	]);

	const pageEntries: MetadataRoute.Sitemap = pages.flatMap(
		({ route, _updatedAt }) => {
			if (!route) return [];
			const isHome = route === '/';

			return [
				{
					url: isHome ? baseUrl : `${baseUrl}${route}`,
					lastModified: _updatedAt || new Date(),
					changeFrequency: isHome ? ('daily' as const) : ('weekly' as const),
					priority: isHome ? 1 : 0.9,
				},
			];
		},
	);

	const postEntries: MetadataRoute.Sitemap = posts.flatMap(
		({ slug, _updatedAt }) =>
			slug
				? [
						{
							url: `${baseUrl}/posts/${slug}`,
							lastModified: _updatedAt || new Date(),
							changeFrequency: 'weekly' as const,
							priority: 0.8,
						},
					]
				: [],
	);

	return [
		{
			url: `${baseUrl}/posts`,
			lastModified: new Date(),
			changeFrequency: 'daily',
			priority: 0.9,
		},
		...pageEntries,
		...postEntries,
	];
}
