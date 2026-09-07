import { getImage, type SanityImageSource } from '@sanity/asset-utils';
import { blurhashToBase64 } from 'blurhash-base64';
import Image from 'next/image';
import {
	buildOptimizedImageUrl,
	isDereferencedAsset,
	resolveAltText,
	resolveImageDimensions,
	resolveImageSizes,
} from '@/lib/image';
import { dataset, projectId } from '@/sanity/env';
import urlFor from '@/sanity/lib/utils';
import type { SmartImageProps } from '@/types';

/**
 * Renders a Sanity image with `next/image`, supporting both dereferenced and
 * referenced assets. Dereferenced assets carry blurhash metadata, which becomes
 * the blur placeholder.
 *
 * The resolution rules — alt text, dimensions, `sizes` — live in
 * `src/lib/image.ts` so they are unit-testable without rendering, and so this
 * component stays a thin mapping onto `next/image`.
 *
 * @param props - Sanity image object plus `next/image` options.
 * @returns A `next/image` element pointing at the Sanity CDN.
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
	...rest
}: SmartImageProps) {
	const { asset } = image;

	if (!asset) {
		return null;
	}

	const isDereferenced = isDereferencedAsset(asset);
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

	const blurHash = isDereferenced ? imageAsset.metadata?.blurHash : undefined;
	const resolvedAlt = resolveAltText({
		alt,
		altText: isDereferenced ? asset.altText : undefined,
		caption: image.caption,
		decorative,
	});

	if (!decorative && !resolvedAlt && process.env.NODE_ENV !== 'production') {
		console.error(
			`SmartImage: no alt text for ${resolvedUrl}. Set altText in the media library, pass alt, or pass decorative if the image is purely presentational.`,
		);
	}

	const dimensions = resolveImageDimensions({
		width,
		height,
		fill,
		dimensions: imageAsset.metadata?.dimensions,
	});

	return (
		<Image
			src={buildOptimizedImageUrl(resolvedUrl, { width, height, quality })}
			alt={resolvedAlt}
			width={dimensions.width}
			height={dimensions.height}
			placeholder={blurHash ? 'blur' : undefined}
			blurDataURL={blurHash ? blurhashToBase64(blurHash) : undefined}
			fill={fill}
			sizes={resolveImageSizes(sizes, fill)}
			quality={quality}
			{...rest}
		/>
	);
}
