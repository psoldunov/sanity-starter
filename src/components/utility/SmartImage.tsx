import { getImage, type SanityImageSource } from '@sanity/asset-utils';
import Image from 'next/image';
import {
	isDereferencedAsset,
	resolveAltText,
	resolveImageDimensions,
	resolveImagePlaceholder,
	resolveImageSizes,
	resolveImageSource,
} from '@/lib/image';
import { dataset, projectId } from '@/sanity/env';
import urlFor from '@/sanity/lib/utils';
import type { SmartImageProps } from '@/types';

/**
 * Reports a content image that ended up with no alt text from any source.
 *
 * Development only: an empty alt is correct for a decorative image and a
 * content bug everywhere else, and a build should not fail on CMS content.
 *
 * @param alt - The alt text that was resolved.
 * @param decorative - Whether the image is marked presentational.
 * @param url - Image URL, so the message names the offending asset.
 */
function warnOnMissingAlt(
	alt: string,
	decorative: boolean | undefined,
	url: string,
): void {
	if (decorative || alt || process.env.NODE_ENV === 'production') {
		return;
	}

	console.error(
		`SmartImage: no alt text for ${url}. Set altText in the media library, pass alt, or pass decorative if the image is purely presentational.`,
	);
}

/**
 * Renders a Sanity image with `next/image`, supporting both dereferenced and
 * referenced assets. Dereferenced assets carry Sanity's LQIP — a base64 data
 * URI usable as-is — which becomes the blur placeholder.
 *
 * The resolution rules — alt text, dimensions, `sizes`, whether the optimiser
 * should be skipped — live in `src/lib/image.ts` so they are unit-testable
 * without rendering, and so this component stays a thin mapping onto
 * `next/image`.
 *
 * @param props - Sanity image object plus `next/image` options.
 * @returns A `next/image` element pointing at the Sanity CDN, or `null` when
 *   there is no image or no asset yet.
 */
export default function SmartImage({
	image,
	width,
	height,
	fill,
	alt,
	decorative,
	sizes,
	quality,
	preload,
	...rest
}: SmartImageProps) {
	// Nullable on purpose: a required image is still empty in a draft — a
	// section just added in Presentation — whatever the generated types say.
	if (!image?.asset) {
		return null;
	}

	const { asset } = image;
	const isDereferenced = isDereferencedAsset(asset);
	// SAFETY: SmartImageObject is the queried subset of SanityImageSource; the
	// asset guard above supplies the field the URL helpers require.
	const source = image as unknown as SanityImageSource;
	const imageAsset = isDereferenced
		? asset
		: getImage(source, { projectId, dataset }).asset;

	// Crop and hotspot can only be applied by the URL builder; without either,
	// the asset's own URL is already correct and cheaper.
	const hasCropOrHotspot = Boolean(image.crop || image.hotspot);
	const resolvedUrl = hasCropOrHotspot ? urlFor(source).url() : imageAsset.url;

	if (!resolvedUrl) {
		return null;
	}

	const placeholder = resolveImagePlaceholder(
		resolvedUrl,
		isDereferenced ? imageAsset.metadata?.lqip : undefined,
	);
	const resolvedAlt = resolveAltText({
		alt,
		altText: isDereferenced ? asset.altText : undefined,
		caption: image.caption,
		decorative,
	});

	warnOnMissingAlt(resolvedAlt, decorative, resolvedUrl);

	const dimensions = resolveImageDimensions({
		width,
		height,
		fill,
		dimensions: imageAsset.metadata?.dimensions,
	});

	// Vector art and GIFs go to the browser as-is: there is nothing to resize
	// or re-encode in an SVG, which Next's optimiser rejects anyway, and an
	// animated GIF it would only pass through.
	const { src, unoptimized } = resolveImageSource(resolvedUrl, {
		width,
		height,
		quality,
	});

	return (
		<Image
			src={src}
			unoptimized={unoptimized}
			alt={resolvedAlt}
			width={dimensions.width}
			height={dimensions.height}
			placeholder={placeholder ? 'blur' : undefined}
			blurDataURL={placeholder}
			fill={fill}
			sizes={resolveImageSizes(sizes, fill)}
			quality={quality}
			preload={preload}
			{...rest}
		/>
	);
}
