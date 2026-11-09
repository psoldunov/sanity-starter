import { resolveLinkHref } from '@/lib/links';
import type { ResolvedDestination } from '@/types';

/**
 * Makes a site-relative URL absolute. Markdown is read away from the page it
 * came from, so a bare `/about` would point nowhere.
 *
 * For a CMS `link` field, use `linkUrl`, which resolves it first.
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

/**
 * Where a CMS `link` field points, as an absolute URL: the same resolution
 * `SmartLink` applies, minus file downloads. A link that can carry a file
 * needs its URL passed to `resolveLinkHref` instead (see `docs/llm.md`).
 *
 * @param link - The queried link, with `page` dereferenced.
 * @param siteUrl - The site origin, without a trailing slash.
 * @returns The absolute URL, or `undefined` when the link goes nowhere.
 */
export function linkUrl(
	link:
		| {
				href?: string | null;
				page?: ResolvedDestination | null;
				sectionId?: string | null;
		  }
		| null
		| undefined,
	siteUrl: string,
): string | undefined {
	const href = link ? resolveLinkHref(link, undefined) : undefined;
	return href ? absoluteUrl(href, siteUrl) : undefined;
}
