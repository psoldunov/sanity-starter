/**
 * Gets the site URL using Vercel environment variables.
 * Falls back to VERCEL_URL for preview deployments, then localhost for local development.
 *
 * @returns The full site URL (e.g., https://example.com)
 */
export function getSiteUrl(): string {
	const explicit = process.env.NEXT_PUBLIC_SITE_URL;
	if (explicit) return explicit.replace(/\/$/, '');

	if (process.env.VERCEL_ENV === 'production') {
		const prodUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
		if (prodUrl) return `https://${prodUrl}`;
	}

	const vercelUrl = process.env.VERCEL_URL;
	if (vercelUrl) return `https://${vercelUrl}`;

	return `http://localhost:${process.env.PORT || 3000}`;
}

/**
 * Whether a URL points somewhere outside this site.
 *
 * Checked by scheme rather than by prefix: `startsWith('http')` also matches a
 * same-site path like `/http-headers`, and misses the protocol-relative
 * `//example.com`, which browsers do treat as external.
 *
 * Trimmed first. Browsers strip leading whitespace from an href, so
 * `'  https://evil.com'` navigates cross-origin — but an untrimmed check calls
 * it internal, and `SmartLink` then omits `target` and `rel='noopener'`. Studio
 * validation does not catch it either, being advisory and not enforced on API
 * writes.
 *
 * @param url - The URL to classify.
 * @returns `true` when the URL leaves this origin over http(s).
 */
export function isExternalUrl(url: string | undefined): boolean {
	if (!url) return false;

	const trimmed = url.trim();
	if (trimmed.startsWith('//')) return true;
	return /^https?:\/\//i.test(trimmed);
}

/**
 * Determines the `target` attribute for a link based on its URL.
 * `mailto:` and `tel:` are handed to the OS and stay in place; only http(s)
 * links to another origin open in a new tab.
 *
 * @param url - The URL to check.
 * @returns `'_blank'` if the URL is external, otherwise `undefined`.
 */
export function getTarget(url: string | undefined): '_blank' | undefined {
	return isExternalUrl(url) ? '_blank' : undefined;
}
