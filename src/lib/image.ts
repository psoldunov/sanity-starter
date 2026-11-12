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

type ImageCrop = {
	top?: number;
	bottom?: number;
	left?: number;
	right?: number;
};

/**
 * Size of the image actually served: the asset's dimensions minus the Studio
 * crop, rounded exactly as `@sanity/image-url` rounds its `rect` parameter.
 *
 * @param dimensions - Intrinsic dimensions from the asset metadata.
 * @param crop - The image's crop, as fractions of each side.
 * @returns The served size, or `undefined` when the dimensions are unknown.
 */
function servedDimensions(
	dimensions: { width?: number; height?: number } | null | undefined,
	crop: ImageCrop | null | undefined,
): { width: number; height: number } | undefined {
	const { width, height } = dimensions ?? {};
	if (!width || !height) return undefined;

	const { top = 0, bottom = 0, left = 0, right = 0 } = crop ?? {};
	const cropLeft = Math.round(left * width);
	const cropTop = Math.round(top * height);
	return {
		width: Math.round(width - right * width - cropLeft),
		height: Math.round(height - bottom * height - cropTop),
	};
}

/**
 * Resolves the dimensions to hand `next/image`, which also reserve the image's
 * box before it loads.
 *
 * A filled image must not receive them — `fill` and `width`/`height` are
 * mutually exclusive. An explicit prop always beats the asset's own size, and
 * when only one side is given the other follows the served image's aspect
 * ratio, so the reserved box has the right shape and nothing shifts on load.
 *
 * @param options.width - Explicit width prop.
 * @param options.height - Explicit height prop.
 * @param options.fill - Whether the image is rendered with `fill`.
 * @param options.dimensions - Intrinsic dimensions from the asset metadata.
 * @param options.crop - The Studio crop applied to the served image, if any.
 * @returns The width and height to pass through, each possibly `undefined`.
 */
export function resolveImageDimensions({
	width,
	height,
	fill,
	dimensions,
	crop,
}: {
	width?: number;
	height?: number;
	fill?: boolean;
	dimensions?: { width?: number; height?: number } | null;
	crop?: ImageCrop | null;
}): { width: number | undefined; height: number | undefined } {
	if (fill) {
		return { width: undefined, height: undefined };
	}

	const served = servedDimensions(dimensions, crop);
	if (!served) {
		return { width, height };
	}

	if (width !== undefined && height === undefined) {
		return {
			width,
			height: Math.round((width * served.height) / served.width),
		};
	}
	if (height !== undefined && width === undefined) {
		return {
			width: Math.round((height * served.width) / served.height),
			height,
		};
	}

	return {
		width: width ?? served.width,
		height: height ?? served.height,
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
 * Whether an image URL points at a file that must reach the browser untouched:
 * an SVG or a GIF.
 *
 * Sanity's image pipeline does not transform SVG at all, and Next's optimiser
 * refuses it unless `dangerouslyAllowSVG` is set. A GIF is here for its
 * animation, which a resize can reduce to the first frame — so neither gets
 * the CDN loader's `w`/`h` parameters, and both render `unoptimized`.
 *
 * @param url - An absolute image URL.
 * @returns `true` when the URL's path ends in `.svg` or `.gif`.
 */
export function isPassThroughUrl(url: string): boolean {
	return isSvgUrl(url) || getImagePath(url).endsWith('.gif');
}
