import { getSiteUrl } from '@/lib/url';

/*
 * `/.well-known/api-catalog` (RFC 9727): a machine-readable pointer to what
 * the site offers agents. It lists the LLM index files and both sitemaps; the
 * sitemaps list the documents. The shape is RFC 9727 Appendix A.2: one link
 * set anchored on the catalog's own URI, each entry an `item`.
 *
 * Every response on the site links here through a `Link` header, set in
 * `next.config.ts` and, on a document's markdown, by its route handler. That
 * is how a client finds it. HEAD is answered from GET by Next, as the RFC
 * requires.
 */
export const dynamic = 'force-static';

/** RFC 9727 §4.2: a Linkset, with the profile that marks it as an API catalog. */
const CONTENT_TYPE =
	'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"';

/**
 * Serves the API catalog.
 *
 * @returns The linkset.
 */
export function GET() {
	const siteUrl = getSiteUrl();

	const catalog = {
		linkset: [
			{
				anchor: `${siteUrl}/.well-known/api-catalog`,
				item: [
					{ href: `${siteUrl}/llms.txt`, type: 'text/plain' },
					{ href: `${siteUrl}/llms-full.txt`, type: 'text/plain' },
					{ href: `${siteUrl}/sitemap.xml`, type: 'application/xml' },
					{ href: `${siteUrl}/sitemap.md`, type: 'text/markdown' },
				],
			},
		],
	};

	return new Response(JSON.stringify(catalog, null, 2), {
		headers: { 'Content-Type': CONTENT_TYPE },
	});
}
