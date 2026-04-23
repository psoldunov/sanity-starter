/**
 * Gets the site URL using Vercel environment variables
 * Falls back to VERCEL_URL for preview deployments, then localhost for local development
 * @returns The full site URL (e.g., https://example.com)
 */
export function getSiteUrl(): string {
	const vercelEnv = process.env.VERCEL_ENV;

	if (vercelEnv === 'production') {
		const prodUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
		if (prodUrl) return `https://${prodUrl}`;
	}

	const vercelUrl = process.env.VERCEL_URL;
	if (vercelUrl) return `https://${vercelUrl}`;

	return 'http://localhost:3000';
}

/**
 * Determines the target attribute for a link based on its URL
 * @param url - The URL to check
 * @returns '_blank' if the URL is external, otherwise undefined
 */
export function getTarget(url: string | undefined): '_blank' | undefined {
	if (!url) return undefined;

	if (url.startsWith('http')) {
		return '_blank';
	}
	return undefined;
}
