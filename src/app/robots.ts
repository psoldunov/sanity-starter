import type { MetadataRoute } from 'next';
import { CRAWLER_DISALLOWED_PATHS } from '@/config';
import { getSiteUrl } from '@/lib/url';

/**
 * robots.txt.
 *
 * Only disallows the reserved application paths. It does not enumerate every
 * allowed route — an earlier version did, which published the site's full page
 * list to anyone who asked and grew without bound. Discovery is the sitemap's
 * job.
 *
 * Pages an editor flagged `noIndex` are deliberately NOT listed here. A
 * `Disallow` stops a crawler fetching the page, so it never reads the
 * `robots: { index: false }` meta tag that actually de-indexes — the URL can
 * still be indexed on inbound links alone. Listing them would also publish
 * exactly the set of pages the editor wanted kept quiet. The meta tag emitted
 * per page is the enforcement.
 */
export default function robots(): MetadataRoute.Robots {
	const baseUrl = getSiteUrl();

	return {
		rules: {
			userAgent: '*',
			allow: '/',
			disallow: [...CRAWLER_DISALLOWED_PATHS],
		},
		sitemap: `${baseUrl}/sitemap.xml`,
	};
}
