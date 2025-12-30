import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/utils';
import { sanityFetch } from '@/sanity/lib/live';
import { PAGES_QUERY } from '@/sanity/lib/queries';
import type { Page } from '@/types';

interface SitemapEntry {
	url: string;
	lastModified?: string | Date;
	changeFrequency?:
		| 'always'
		| 'hourly'
		| 'daily'
		| 'weekly'
		| 'monthly'
		| 'yearly'
		| 'never';
	priority?: number;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const baseUrl = getSiteUrl();

	const sitemapEntries: SitemapEntry[] = [];

	try {
		const { data: pages }: { data: Page[] } = await sanityFetch({
			query: PAGES_QUERY,
			stega: false,
			perspective: 'published',
		});

		for (const page of pages) {
			if (page.route?.current) {
				const url =
					page.route.current === '/' ? baseUrl : baseUrl + page.route.current;

				sitemapEntries.push({
					url,
					lastModified: page._updatedAt || new Date(),
					changeFrequency: page.route.current === '/' ? 'daily' : 'weekly',
					priority: page.route.current === '/' ? 1.0 : 0.8,
				});
			}
		}
	} catch (error) {
		console.error('Error generating sitemap:', error);

		sitemapEntries.push({
			url: baseUrl,
			lastModified: new Date(),
			changeFrequency: 'daily',
			priority: 1.0,
		});
	}

	sitemapEntries.sort((a, b) => {
		if (a.priority !== b.priority) {
			return (b.priority || 0) - (a.priority || 0);
		}
		return a.url.localeCompare(b.url);
	});

	return sitemapEntries;
}
