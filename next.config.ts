import type { NextConfig } from 'next';
import { API_CATALOG_LINK } from './src/config/llm';

/*
 * The markdown layer for AI agents (see `docs/llm.md`). A page's or post's
 * markdown is served by the route handler in
 * `src/app/api/markdown/[...path]/route.ts` at its own `.md` URL, and only
 * there: a page URL requested with `Accept: text/markdown` redirects to it.
 *
 * Redirecting rather than answering in place is what keeps this safe behind
 * any cache. Every URL has exactly one body, so a CDN that ignores `Vary` has
 * nothing to mix up. The redirect carries no caching headers (`next start`
 * sends none of the `headers()` below with a redirect), and no cache may
 * store a 307 without explicit freshness: it is not heuristically cacheable
 * (RFC 9111 §3, RFC 9110 §15.1), so a browser is never handed one. The
 * worst a cache can do is give an agent the HTML it would have got anyway.
 */

/** Where the markdown route handler lives. */
const MARKDOWN_ROUTE = '/api/markdown';

/**
 * A document's markdown path without its `.md`, e.g. `about` for `/about.md`.
 * Anything under `/api/` is an app route, and `/sitemap.md` a file of its own
 * (`src/app/sitemap.md/`), so neither is a document's markdown.
 */
const DOCUMENT_PATH = '(?!api/|sitemap\\.md$).+';

/** A document's markdown URL, e.g. `/about.md`: rewritten to the route. */
const MARKDOWN_PATH = `/:path(${DOCUMENT_PATH})\\.md`;

/**
 * Every URL except a document's markdown, public or under the route handler's
 * own path. The route handler writes the `Link` header of those itself.
 */
const NOT_MARKDOWN_PATH = `/:path((?!api/markdown/|${DOCUMENT_PATH}\\.md$).*)`;

/**
 * A URL an agent may ask for as markdown: no file extension, and not one of
 * the app's own routes (`/api`, the Studio at `/admin`, `/_next`) or the blog
 * index at `/posts`, which is paginated and has no markdown of its own — the
 * `Posts` group in `/llms.txt` is its counterpart. A path with a dot is a
 * file, so `/sitemap.xml` or `/llms.txt` requested with `Accept: text/markdown`
 * still gets the file.
 *
 * The list repeats `PROTECTED_ROUTE_PATTERNS` (`src/config/index.ts`), which
 * this file cannot import: its `@/` imports do not resolve here. A route added
 * to `STATIC_ROUTES` belongs on it too until the markdown route can serve it;
 * otherwise an agent asking for its markdown gets a 404 where a browser gets
 * the page.
 */
const PAGE_PATH = '/:path((?!(?:api|admin|_next)(?:/|$))(?!posts$)[^.]+)';

/**
 * `Accept` lists `text/markdown` before any `text/html`. Next anchors the
 * pattern at both ends.
 *
 * shortcut: reads the order of the list, not its q-values, so
 * `text/html;q=0.1, text/markdown` still gets HTML and
 * `text/markdown;q=0, text/html` gets markdown. The match is also
 * case-sensitive (Next builds the RegExp without `i`), so `Text/Markdown`
 * gets HTML. Parse the header in a proxy if a real client ever sends these.
 */
const ACCEPTS_MARKDOWN = [
	{
		type: 'header' as const,
		key: 'accept',
		value: '(?:(?!text/html).)*text/markdown.*',
	},
];

const nextConfig: NextConfig = {
	// Stable in Next 16 (no longer `experimental.typedRoutes`). Type-checks every
	// `<Link href>` against the routes that actually exist, which matters in a
	// codebase whose link layer builds paths by hand from CMS data.
	typedRoutes: true,

	images: {
		formats: ['image/avif', 'image/webp'],
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'cdn.sanity.io',
			},
		],
		qualities: [75, 85, 100],
	},

	async headers() {
		return [
			{
				source: '/:path*',
				headers: [
					{ key: 'X-Content-Type-Options', value: 'nosniff' },
					{ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
					// The embedded Studio needs to frame itself and be framed by
					// Presentation, so `X-Frame-Options: DENY` is not an option here.
					// This limits framing to the site's own origin instead.
					{
						key: 'Content-Security-Policy',
						value: "frame-ancestors 'self' https://*.sanity.studio",
					},
				],
			},
			// Points every response at the RFC 9727 API catalog, except a
			// document's markdown. That route handler sets `Link` itself, because
			// only it knows whether the document exists: a found document also
			// names its HTML page as canonical, a 404 does not. A header both set
			// would be resolved differently by `next start` (config wins) and by
			// Vercel (the handler wins), so exactly one of them owns it per URL.
			{
				source: NOT_MARKDOWN_PATH,
				headers: [{ key: 'Link', value: API_CATALOG_LINK }],
			},
		];
	},

	async redirects() {
		// Content negotiation, as a redirect to the document's `.md` URL. 307,
		// never 308: a permanent redirect is cacheable by default, and this one
		// only holds for clients that ask for markdown. Do not add a
		// `Cache-Control` to it.
		return [
			{
				source: '/',
				has: ACCEPTS_MARKDOWN,
				destination: '/index.md',
				permanent: false,
			},
			{
				source: PAGE_PATH,
				has: ACCEPTS_MARKDOWN,
				destination: '/:path.md',
				permanent: false,
			},
		];
	},

	async rewrites() {
		return {
			// `afterFiles`, so a file added at a `.md` path later still wins over
			// the document markdown, while the rewrite runs before the
			// `[[...slug]]` catch-all would claim the path. `MARKDOWN_PATH` skips
			// `/api/`: without that, the rewritten path would come back through
			// here as `/api/markdown/api/markdown/about.md`.
			afterFiles: [
				{
					source: MARKDOWN_PATH,
					destination: `${MARKDOWN_ROUTE}/:path.md`,
				},
			],
		};
	},
};

export default nextConfig;
