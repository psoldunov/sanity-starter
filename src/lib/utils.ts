import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Page } from '@/types';
import { dynamicSections } from './sections';

/**
 * Combines class names using clsx and tailwind-merge
 * @param inputs - Class values to combine
 * @returns Merged class names string
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Builds an optimized Sanity CDN image URL with transformation query parameters.
 *
 * Adds width (`w`), height (`h`), and quality (`q`) query parameters to a Sanity image URL
 * for on-the-fly image transformations via Sanity's CDN.
 *
 * @param url - The base Sanity image URL to optimize (typically from `image.asset.url`)
 * @param options - Configuration options for the optimized URL
 * @param options.width - Optional width in pixels (adds `w` query parameter)
 * @param options.height - Optional height in pixels (adds `h` query parameter)
 * @param options.quality - Image quality from 1-100 (adds `q` query parameter, defaults to 100)
 * @returns The optimized Sanity CDN URL string with transformation query parameters appended
 */
export function buildOptimizedImageUrl(
	url: string,
	{
		width,
		height,
		quality = 100,
	}: {
		width?: number;
		height?: number;
		quality?: number;
	},
): string {
	const urlObject = new URL(url);

	if (width) {
		urlObject.searchParams.set('w', width.toString());
	}
	if (height) {
		urlObject.searchParams.set('h', height.toString());
	}
	if (quality) {
		urlObject.searchParams.set('q', quality.toString());
	}

	return urlObject.toString();
}

/**
 * Normalizes slug parameters from Next.js dynamic routes
 * @param slug - The slug parameter (undefined, string, or string array)
 * @returns Normalized slug path starting with '/'
 */
export function normalizeSlug(slug?: string | string[]) {
	if (!slug) {
		return '/';
	}

	if (typeof slug === 'string') {
		return slug;
	}

	return `/${slug.join('/')}`;
}

/**
 * Splits a slug string into an array of parts
 * @param slug - The slug string to split
 * @returns Array of slug parts (excluding empty strings)
 */
export function splitSlug(slug: string): string[] {
	return slug.split('/').filter((part) => part !== '');
}

/**
 * Checks if a route contains sections that require dynamic parameters.
 *
 * @param page - The page to check for dynamic sections
 * @returns `true` if the page has dynamic sections, `false` otherwise
 */
export function hasDynamicParams(page: Page): boolean {
	if (!page.sections?.length) {
		return false;
	}

	return page.sections.some((section) =>
		(dynamicSections as string[]).includes(section._type),
	);
}

/**
 * Gets the site URL using Vercel environment variables
 * Falls back to localhost for local development
 * @returns The full site URL (e.g., https://example.com)
 */
export function getSiteUrl(): string {
	const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
	const vercelEnv = process.env.VERCEL_ENV;

	if (vercelUrl && vercelEnv === 'production') {
		return `https://${vercelUrl}`;
	}

	return 'http://localhost:3000';
}
