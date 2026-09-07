import type { SanityImageAsset } from '@/sanity/types/sanity.types';

/**
 * Whether an image's `asset` has been dereferenced by the query (`asset->`)
 * rather than left as a bare reference.
 *
 * Only a dereferenced asset carries the blurhash and intrinsic dimensions, so
 * this is what decides whether a blur placeholder is available.
 *
 * @param asset - The `asset` value from a Sanity image object.
 * @returns `true` when the asset is a full `sanity.imageAsset` document.
 */
export function isDereferencedAsset(asset: unknown): asset is SanityImageAsset {
	return (
		typeof asset === 'object' &&
		asset !== null &&
		'url' in asset &&
		'_type' in asset &&
		(asset as { _type: string })._type === 'sanity.imageAsset'
	);
}

/**
 * Chooses the alt text for a Sanity image.
 *
 * The explicit `alt` prop wins: the media library's `altText` describes the
 * asset globally, but the same asset can mean different things in different
 * places, so a per-usage description has to be able to override it.
 * `decorative` beats everything — an image whose meaning is already carried by
 * adjacent text is announced twice otherwise.
 *
 * @param options.alt - Explicit per-usage alt text.
 * @param options.altText - `altText` from the dereferenced media-library asset.
 * @param options.caption - Caption on the image object.
 * @param options.decorative - Marks the image as purely presentational.
 * @returns The alt text to render; `''` means "announce nothing".
 */
export function resolveAltText({
	alt,
	altText,
	caption,
	decorative,
}: {
	alt?: string;
	altText?: string | null;
	caption?: string | null;
	decorative?: boolean;
}): string {
	if (decorative) return '';
	return alt ?? altText ?? caption ?? '';
}

/**
 * Resolves the intrinsic dimensions to hand `next/image`.
 *
 * A filled image must not receive them — `fill` and `width`/`height` are
 * mutually exclusive — and an explicit prop always beats the asset's own size.
 *
 * @param options.width - Explicit width prop.
 * @param options.height - Explicit height prop.
 * @param options.fill - Whether the image is rendered with `fill`.
 * @param options.dimensions - Intrinsic dimensions from the asset metadata.
 * @returns The width and height to pass through, each possibly `undefined`.
 */
export function resolveImageDimensions({
	width,
	height,
	fill,
	dimensions,
}: {
	width?: number;
	height?: number;
	fill?: boolean;
	dimensions?: { width?: number; height?: number } | null;
}): { width: number | undefined; height: number | undefined } {
	if (fill) {
		return { width: undefined, height: undefined };
	}

	return {
		width: width ?? dimensions?.width,
		height: height ?? dimensions?.height,
	};
}

/**
 * Resolves the `sizes` attribute.
 *
 * Without one, a filled image makes the browser assume `100vw` and pick the
 * widest candidate in the srcset on every viewport, phones included.
 *
 * @param sizes - Explicit `sizes` prop.
 * @param fill - Whether the image is rendered with `fill`.
 * @returns The `sizes` value, or `undefined` when none applies.
 */
export function resolveImageSizes(
	sizes: string | undefined,
	fill: boolean | undefined,
): string | undefined {
	return sizes ?? (fill ? '100vw' : undefined);
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
 * @param options.quality - Image quality from 1-100 (adds `q` query parameter, defaults to 75)
 * @returns The optimized Sanity CDN URL string with transformation query parameters appended
 */
export function buildOptimizedImageUrl(
	url: string,
	{
		width,
		height,
		quality = 75,
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
	if (quality !== undefined) {
		urlObject.searchParams.set('q', quality.toString());
	}

	return urlObject.toString();
}
