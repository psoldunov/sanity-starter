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
 * A route handler rather than `robots.ts`, because `MetadataRoute.Robots` has
 * no field for the `Content-Signal` line. It sits inside the one
 * `User-agent: *` group. Per-bot groups (`User-agent: GPTBot`) would not add
 * to that group but replace it for the bots they name, which silently drops
 * the `Disallow` lines for them.
 */
export const dynamic = 'force-static';

/**
 * Writes `robots.txt`: one `User-agent: *` group with the content signals,
 * then the sitemap.
 *
 * @returns The file, as `text/plain`.
 */
export function GET() {
	const signals = Object.entries(CONTENT_SIGNALS)
		.map(([signal, value]) => `${signal}=${value}`)
		.join(', ');

	const body = [
		'User-agent: *',
		`Content-Signal: ${signals}`,
		'Allow: /',
		...CRAWLER_DISALLOWED_PATHS.map((path) => `Disallow: ${path}`),
		'',
		`Sitemap: ${getSiteUrl()}/sitemap.xml`,
		'',
	].join('\n');

	return new Response(body, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
}
