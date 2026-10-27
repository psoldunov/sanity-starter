import { documentPath } from '@/lib/links';
import { pageToMarkdown, postToMarkdown } from '@/lib/markdown/document';
import {
	htmlPathToMarkdownPath,
	markdownPathToHtmlPath,
} from '@/lib/markdown/paths';
import { llmResponse } from '@/lib/markdown/response';
import { resolveRedirect } from '@/lib/redirects';
import { splitSlug } from '@/lib/slug';
import { getSiteUrl } from '@/lib/url';
import {
	getIndexablePages,
	getIndexablePosts,
	getPublishedPage,
	getPublishedPost,
	getPublishedRedirects,
	getPublishedSettings,
} from '@/sanity/lib/fetchers';

/*
 * A page or post as markdown, for AI agents.
 *
 * Nobody requests this URL directly. A rewrite in `next.config.ts` sends it
 * every `/<path>.md` request, and a page URL requested with
 * `Accept: text/markdown` redirects to that `.md` URL first. The `path` param
 * is always the public markdown path, e.g. `['about.md']`.
 *
 * Static: the indexable documents are prerendered at build time and any other
 * path is rendered once on first request. `force-static` keeps it that way —
 * the handler reads no request data, and the fetchers it calls never touch the
 * draft-mode cookie.
 *
 * The canonical `Link` header is set in `next.config.ts`, not here; that file
 * says why.
 */
export const dynamic = 'force-static';

/** Where post markdown lives: `/posts/<slug>.md`. */
const POST_PATH_PREFIX = `${documentPath('post')}/`;

/**
 * The markdown path of every indexable page and post, prerendered at build
 * time. Unlisted documents are included: they are left out of the index
 * files, not out of the markdown.
 *
 * @returns One `path` param per document, e.g. `{ path: ['about.md'] }`.
 */
// fallow's Next plugin knows `generateStaticParams` on pages but not on route
// handlers, where Next reads it just the same (route.md → "Static Generation").
// fallow-ignore-next-line unused-export
export async function generateStaticParams() {
	const [pages, posts] = await Promise.all([
		getIndexablePages(),
		getIndexablePosts(),
	]);

	const paths = [
		...pages.flatMap(({ route }) => (route ? [route] : [])),
		...posts.flatMap(({ slug }) => (slug ? [documentPath('post', slug)] : [])),
	];

	return paths.map((path) => ({
		path: splitSlug(htmlPathToMarkdownPath(path)),
	}));
}

/**
 * Where a page that moved now lives, as markdown: the redirect the HTML route
 * would answer with, pointed at the destination's `.md` URL. Without it an
 * agent holding the old URL would get a 404 where a browser gets the page.
 *
 * @param htmlPath - The requested page path.
 * @returns The redirect response, or `undefined` when no rule applies.
 */
async function markdownRedirect(
	htmlPath: string,
): Promise<Response | undefined> {
	const match = resolveRedirect(
		await getPublishedRedirects(htmlPath),
		htmlPath,
	);
	if (!match) return undefined;

	// A section anchor or query string has no meaning in the markdown.
	const [target] = match.url.split(/[?#]/);

	return new Response(null, {
		status: match.statusCode,
		headers: { Location: htmlPathToMarkdownPath(target || '/') },
	});
}

/**
 * A post's markdown, or a 404. A `noIndex` post gets none: the editor asked
 * for it to stay out of search, and the LLM layer honours that the same way.
 *
 * @param slug - The post slug.
 * @returns The response.
 */
async function postMarkdown(slug: string): Promise<Response> {
	const [post, settings] = await Promise.all([
		getPublishedPost(slug),
		getPublishedSettings(),
	]);
	if (!post || post.noIndex) return notFound();

	return llmResponse(
		postToMarkdown(post, {
			siteUrl: getSiteUrl(),
			siteDescription: settings?.siteDescription,
		}),
		{ format: 'markdown' },
	);
}

/**
 * Serves a page's or post's markdown, follows a redirect rule, or answers
 * 404. A `noIndex` page gets no markdown, as `postMarkdown` explains.
 *
 * @param _request - Unread; the route is static.
 * @param context.params - The public markdown path, split into segments.
 * @returns The markdown, a redirect, or a 404.
 */
export async function GET(
	_request: Request,
	{ params }: RouteContext<'/api/markdown/[...path]'>,
) {
	const { path } = await params;
	const htmlPath = markdownPathToHtmlPath(`/${path.join('/')}`);
	if (!htmlPath) return notFound();

	if (htmlPath.startsWith(POST_PATH_PREFIX)) {
		const slug = htmlPath.slice(POST_PATH_PREFIX.length);
		return slug.includes('/') ? notFound() : postMarkdown(slug);
	}

	const [page, settings] = await Promise.all([
		getPublishedPage(htmlPath),
		getPublishedSettings(),
	]);

	if (!page) return (await markdownRedirect(htmlPath)) ?? notFound();
	if (page.noIndex || !page.sections?.length) return notFound();

	return llmResponse(
		pageToMarkdown(page, {
			siteUrl: getSiteUrl(),
			siteDescription: settings?.siteDescription,
		}),
		{ format: 'markdown' },
	);
}

/**
 * The 404 for a path with no markdown.
 *
 * @returns The response.
 */
function notFound(): Response {
	return llmResponse('# Not found\n', { format: 'markdown', status: 404 });
}
