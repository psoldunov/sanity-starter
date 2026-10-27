import { indexGroups, sitemapMarkdown } from '@/lib/markdown/indexFiles';
import { llmResponse } from '@/lib/markdown/response';
import { getSiteUrl } from '@/lib/url';
import {
	getIndexablePages,
	getIndexablePosts,
	getPublishedSettings,
} from '@/sanity/lib/fetchers';

/*
 * `/sitemap.md`: `/llms.txt` without the descriptions. Search engines read
 * `sitemap.xml`; this one is for agents, and lists markdown URLs.
 *
 * `MARKDOWN_PATH` in `next.config.ts` leaves this path out, so it is neither
 * rewritten to a page's markdown nor given a page's canonical `Link`.
 */
export const dynamic = 'force-static';

/**
 * Builds `/sitemap.md` from the indexable documents.
 *
 * @returns The file, as `text/markdown`.
 */
export async function GET() {
	const [pages, posts, settings] = await Promise.all([
		getIndexablePages(),
		getIndexablePosts(),
		getPublishedSettings(),
	]);

	const body = sitemapMarkdown(
		indexGroups(pages, posts, {
			siteUrl: getSiteUrl(),
			siteDescription: settings?.siteDescription,
		}),
	);

	return llmResponse(body, { format: 'markdown' });
}
