import { pageToMarkdown, postToMarkdown } from '@/lib/markdown/document';
import { isListed, llmsFullTxt } from '@/lib/markdown/indexFiles';
import { llmResponse } from '@/lib/markdown/response';
import { getSiteUrl } from '@/lib/url';
import {
	getIndexablePages,
	getIndexablePosts,
	getPublishedPage,
	getPublishedPost,
	getPublishedSettings,
} from '@/sanity/lib/fetchers';

/*
 * `/llms-full.txt`: every listed page's and post's markdown in one file —
 * pages in route order, then posts newest first — for an agent that wants the
 * whole site in one read. Optional documents are included; unlisted ones are
 * not.
 */
export const dynamic = 'force-static';

/**
 * Builds `/llms-full.txt`.
 *
 * @returns The file, as `text/plain`.
 */
export async function GET() {
	const [pages, posts, settings] = await Promise.all([
		getIndexablePages(),
		getIndexablePosts(),
		getPublishedSettings(),
	]);

	// Independent reads, issued together. Each is the same cached request the
	// document's own `.md` route makes.
	const [fullPages, fullPosts] = await Promise.all([
		Promise.all(
			pages.flatMap(({ route, llmsListing }) =>
				route && isListed(llmsListing) ? [getPublishedPage(route)] : [],
			),
		),
		Promise.all(
			posts.flatMap(({ slug, llmsListing }) =>
				slug && isListed(llmsListing) ? [getPublishedPost(slug)] : [],
			),
		),
	]);

	const context = {
		siteUrl: getSiteUrl(),
		siteDescription: settings?.siteDescription,
	};
	const documents = [
		...fullPages.flatMap((page) =>
			page?.sections?.length ? [pageToMarkdown(page, context)] : [],
		),
		...fullPosts.flatMap((post) =>
			post?.slug ? [postToMarkdown(post, context)] : [],
		),
	];

	return llmResponse(llmsFullTxt(documents), { format: 'text' });
}
