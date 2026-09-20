import type { SanityImageAsset } from '@/sanity/types/sanity.types';

/**
 * Whether an image's `asset` has been dereferenced by the query (`asset->`)
 * rather than left as a bare reference.
 *
 * Only a dereferenced asset carries the LQIP and intrinsic dimensions, so this
 * is what decides whether a blur placeholder is available.
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
 * Lowercased path of an image URL.
 *
 * File-type checks read the path rather than the whole URL: a Sanity URL
 * carrying transformation parameters (`…/logo.svg?w=320`) no longer ends in
 * its file extension.
 *
 * @param url - An absolute image URL.
 * @returns The lowercased pathname, or `''` when the URL does not parse.
 */
function getImagePath(url: string): string {
	try {
		return new URL(url).pathname.toLowerCase();
	} catch {
		return '';
	}
}

/**
 * Whether an image URL points at an SVG.
 *
 * @param url - An absolute image URL.
 * @returns `true` when the URL's path ends in `.svg`.
 */
function isSvgUrl(url: string): boolean {
	return getImagePath(url).endsWith('.svg');
}

/**
 * Drops the blur placeholder for SVGs.
 *
 * `next/image` paints the placeholder behind the `<img>` until the file has
 * loaded, and vector art is usually a logo on a transparent background — so
 * the blur shows straight through the artwork.
 *
 * @param url - The resolved image URL.
 * @param lqip - The asset's low-quality image placeholder, a base64 data URI.
 * @returns The LQIP for raster images, or `undefined` for SVGs.
 */
export function resolveImagePlaceholder(
	url: string,
	lqip: string | undefined,
): string | undefined {
	return isSvgUrl(url) ? undefined : lqip;
}

/**
 * Whether an image URL points at a file Next's optimiser should not touch: an
 * SVG or a GIF.
 *
 * SVG is vector, so there is nothing to resize or re-encode, and Next refuses
 * it outright unless `dangerouslyAllowSVG` is set. A GIF is here for its
 * animation, which the optimiser passes through unchanged while warning about
 * it — so the round trip buys nothing.
 *
 * Next already forces `unoptimized` for SVG on its own (`get-img-props`
 * strips the query before testing the extension, so a transformed Sanity URL
 * is still recognised). GIF is the case it does not cover. SVG stays listed
 * here so the decision is explicit and testable in one place, and so the CDN
 * transformation parameters are not appended to a URL that ignores them.
 *
 * @param url - An absolute image URL.
 * @returns `true` when the URL's path ends in `.svg` or `.gif`.
 */
function isPassThroughUrl(url: string): boolean {
	return isSvgUrl(url) || getImagePath(url).endsWith('.gif');
}

/**
 * Chooses what `next/image` is handed for a Sanity image URL: raster images get
 * the CDN transformation parameters, vector art and GIFs go through untouched
 * and unoptimised (see `isPassThroughUrl`).
 *
 * @param url - The resolved Sanity image URL.
 * @param options - Width, height and quality for raster transformations.
 * @returns The `src` to render and whether to skip Next's optimiser.
 */
export function resolveImageSource(
	url: string,
	options: { width?: number; height?: number; quality?: number },
): { src: string; unoptimized: boolean } {
	if (isPassThroughUrl(url)) {
		return { src: url, unoptimized: true };
	}

	return { src: buildOptimizedImageUrl(url, options), unoptimized: false };
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
 * @throws {TypeError} When `url` is not an absolute URL.
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
	let urlObject: URL;

	// `new URL` throws a bare "Invalid URL" that names nothing. Which asset is
	// the only thing worth knowing when this fires from inside a page render.
	try {
		urlObject = new URL(url);
	} catch (error) {
		throw new TypeError(`Invalid image URL: ${url}`, { cause: error });
	}

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
