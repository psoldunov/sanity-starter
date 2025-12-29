import {
	getFileAsset,
	type SanityFileSource,
	type SanityImageSource,
} from '@sanity/asset-utils';
import { createImageUrlBuilder } from '@sanity/image-url';
import type { PortableTextBlock, Slug } from 'sanity';
import { PROTECTED_ROUTE_PATTERNS } from '@/config';
import { client as sanityClient } from '@/sanity/lib/client';

const builder = createImageUrlBuilder(sanityClient);

/**
 * Gets the file asset information for a Sanity file source.
 *
 * @param sanityFile - The Sanity file source object to get the asset for
 * @returns The file asset object containing URL and metadata
 */
export function getSanityFileUrl(sanityFile: SanityFileSource) {
	return getFileAsset(sanityFile, {
		projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
		dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
	});
}

/**
 * Creates an image URL builder for Sanity images
 * @param source - The Sanity image source (asset reference, image object, or image URL)
 * @returns Image URL builder instance that can be chained with transformation methods
 */
export default function urlFor(source: SanityImageSource) {
	return builder.image(source);
}

/**
 * Generates a cached OG image URL using Next.js image optimization
 * Takes a SanityImage, optimizes it for OG dimensions, and returns a cached URL
 */
export function getCachedOGImageUrl(image: SanityImageSource): string {
	const sanityImageUrl = urlFor(image)
		.width(1200)
		.height(630)
		.format('jpg')
		.quality(85)
		.url();

	// Use Next.js image optimization API to cache the image
	const encodedImageUrl = encodeURIComponent(sanityImageUrl);
	return `/_next/image?url=${encodedImageUrl}&w=1200&q=85`;
}

/**
 * Strips non-printable characters and normalizes line breaks in a string
 * @param input - The input string to process
 * @returns The formatted string with normalized line breaks
 */
export function stripNonPrintables(input: string): string {
	const formatted = input
		.replace(/&zwnj;/g, '\n')
		.replace(/\\n/g, '\n')
		.replace(/\\n/g, ' ');
	return formatted;
}

/**
 * Extracts plain text from an array of PortableText blocks.
 *
 * @param portableText - Array of PortableText blocks to extract text from
 * @returns A single string containing all extracted text, with blocks joined by spaces
 */
export function extractPortableText(portableText: PortableTextBlock[]): string {
	return portableText
		.map((block) => {
			if (
				'children' in block &&
				Array.isArray(block.children) &&
				block.children.length > 0
			) {
				return (block.children as Array<{ text?: string }>)
					.map((child) => child.text || '')
					.join(' ');
			}
			return '';
		})
		.join(' ');
}

/**
 * Checks if a given slug matches any protected route pattern.
 * Protected routes are paths that are reserved for system use (e.g., /api/*, /admin/*).
 *
 * @param slug - The Sanity Slug object to check against protected route patterns
 * @returns `true` if the slug's current value starts with any protected route prefix, `false` otherwise
 */
export function isProtectedRoute(slug: Slug): boolean {
	return PROTECTED_ROUTE_PATTERNS.some((pattern) => {
		const patternPrefix = pattern.replace('/*', '');
		return slug?.current?.startsWith(patternPrefix);
	});
}

/**
 * Generates an error message for a slug that conflicts with a protected route pattern.
 * If the slug matches a specific protected route, returns a message identifying the conflicting pattern.
 * Otherwise, returns a generic error message.
 *
 * @param slug - The Sanity Slug object that conflicts with a protected route
 * @returns An error message string describing the route conflict
 */
export function getProtectedRouteError(slug: Slug): string {
	const conflictingPattern = PROTECTED_ROUTE_PATTERNS.find((pattern) => {
		const patternPrefix = pattern.replace('/*', '');
		return slug?.current?.startsWith(patternPrefix);
	});

	if (conflictingPattern) {
		return `Route cannot start with "${conflictingPattern.replace('/*', '')}" as this path is protected`;
	}

	return 'This route conflicts with a protected path';
}
