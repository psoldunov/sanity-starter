/**
 * Makes a site-relative URL absolute. Markdown is read away from the page it
 * came from, so a bare `/about` would point nowhere.
 *
 * To serialize a CMS `link` field (`SmartLinkProps`), resolve it with
 * `resolveLinkHref` from `@/lib/links` first, then pass the result here.
 *
 * @param href - The URL as stored or resolved.
 * @param siteUrl - The site origin, without a trailing slash.
 * @returns The absolute URL, or `undefined` for an empty value or an in-page
 *   anchor, which has no page to belong to once the markdown leaves it.
 */
export function absoluteUrl(href: string, siteUrl: string): string | undefined {
	const trimmed = href.trim();

	// A path on this site; `//host` is another site, protocol-relative.
	if (/^\/(?!\/)/.test(trimmed)) return `${siteUrl}${trimmed}`;

	// An external, `mailto:` or `tel:` URL passes through.
	return /^[^#]/.test(trimmed) ? trimmed : undefined;
}
