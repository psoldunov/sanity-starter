import {
	getFileAsset,
	type SanityFileSource,
	type SanityImageSource,
} from '@sanity/asset-utils';
import { createImageUrlBuilder } from '@sanity/image-url';
import { client as sanityClient } from '@/sanity/lib/client';
import type {
	SanityFileAssetReference,
	SanityImageAsset,
	SanityImageAssetReference,
	SanityImageCrop,
	SanityImageHotspot,
} from '@/sanity/types/sanity.types';

const builder = createImageUrlBuilder(sanityClient);

/**
 * Union of project-level image shapes accepted by `urlFor` and
 * `getCachedOGImageUrl`. Covers both the strict library source type and
 * the looser shape produced by Sanity TypeGen (optional `asset`).
 */
export type ImageInput =
	| SanityImageSource
	| {
			/**
			 * Either an unresolved reference, or a full asset when the query
			 * dereferenced it with `asset->` — post cover images do the latter.
			 */
			asset?: SanityImageAssetReference | SanityImageAsset | null;
			crop?: SanityImageCrop | null;
			hotspot?: SanityImageHotspot | null;
			_type?: string;
	  };

/**
 * Union of project-level file shapes accepted by `getSanityFileUrl`.
 * Covers both the strict library source type and the looser shape
 * produced by Sanity TypeGen.
 */
export type FileInput =
	| SanityFileSource
	| {
			asset?: SanityFileAssetReference | null;
			_type?: string;
	  };

/**
 * Gets the file asset information for a Sanity file source.
 *
 * @param sanityFile - The Sanity file source object to get the asset for
 * @returns The file asset object containing URL and metadata
 */
export function getSanityFileUrl(sanityFile: FileInput) {
	return getFileAsset(sanityFile as SanityFileSource, {
		projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
		dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
	});
}

/**
 * Creates an image URL builder for Sanity images
 * @param source - The Sanity image source (asset reference, image object, or image URL)
 * @returns Image URL builder instance that can be chained with transformation methods
 */
export default function urlFor(source: ImageInput) {
	return builder.image(source as SanityImageSource);
}

/**
 * Generates a cached OG image URL using Next.js image optimization.
 * Routes the Sanity CDN URL through `/_next/image` so Next caches/optimizes it.
 *
 * @param image - The Sanity image source to optimize for OG dimensions
 * @returns A `/_next/image` URL pointing at the optimized OG image
 */
export function getCachedOGImageUrl(image: ImageInput): string {
	const sanityImageUrl = urlFor(image)
		.width(1200)
		.height(630)
		.format('jpg')
		.quality(85)
		.url();

	const encodedImageUrl = encodeURIComponent(sanityImageUrl);
	return `/_next/image?url=${encodedImageUrl}&w=1200&q=85`;
}

/**
 * Normalizes line breaks in a string — converts HTML `&zwnj;` entities and escaped `\n` to real newlines.
 * @param input - The input string to process
 * @returns The string with normalized line breaks
 */
export function normalizeLineBreaks(input: string): string {
	return input.replace(/&zwnj;/g, '\n').replace(/\\n/g, '\n');
}
