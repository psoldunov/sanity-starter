import type { MetadataRoute } from 'next';
import { CRAWLER_DISALLOWED_PATHS } from '@/config';
import { CONTENT_SIGNALS } from '@/config/llm';
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
 *
 * `Content-Signal` (contentsignals.org, see `docs/llm.md`) goes through the
 * rule's `other` field (Next 16.3+), which Next writes verbatim inside the
 * rule's `User-Agent` block. Keep the one `*` rule: a rule for a single bot
 * (`GPTBot`) would replace it for that bot and drop its `Disallow` lines.
 *
 * @returns The robots.txt rules.
 */
export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: '*',
			allow: '/',
			disallow: [...CRAWLER_DISALLOWED_PATHS],
			other: {
				'Content-Signal': Object.entries(CONTENT_SIGNALS)
					.map(([signal, value]) => `${signal}=${value}`)
					.join(', '),
			},
		},
		sitemap: `${getSiteUrl()}/sitemap.xml`,
	};
}
