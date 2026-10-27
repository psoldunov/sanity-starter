import { indexGroups, llmsTxt } from '@/lib/markdown/indexFiles';
import { llmResponse } from '@/lib/markdown/response';
import { getSiteUrl } from '@/lib/url';
import {
	getIndexablePages,
	getIndexablePosts,
	getPublishedSettings,
} from '@/sanity/lib/fetchers';

/*
 * `/llms.txt`: the site in brief for language models, listing every listed
 * page and post by its markdown URL. Static, like `sitemap.xml`.
 */
export const dynamic = 'force-static';

/** Used when the settings singleton has no site name yet. */
const FALLBACK_SITE_NAME = 'Site';

/**
 * Builds `/llms.txt` from the published settings and indexable documents.
 *
 * @returns The file, as `text/plain`.
 */
export async function GET() {
	const [pages, posts, settings] = await Promise.all([
		getIndexablePages(),
		getIndexablePosts(),
		getPublishedSettings(),
	]);

	const body = llmsTxt({
		siteName: settings?.siteName || FALLBACK_SITE_NAME,
		summary: settings?.siteDescription,
		groups: indexGroups(pages, posts, {
			siteUrl: getSiteUrl(),
			siteDescription: settings?.siteDescription,
		}),
	});

	return llmResponse(body, { format: 'text' });
}
