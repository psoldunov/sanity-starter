import { getImage } from '@sanity/asset-utils';
import { blurhashToBase64 } from 'blurhash-base64';
import Image from 'next/image';
import type { ImageAsset } from 'sanity';
import { buildOptimizedImageUrl } from '@/lib/utils';
import { dataset, projectId } from '@/sanity/env';
import urlFor from '@/sanity/lib/utils';
import type { SmartImageProps } from '@/types';

function isDereferencedAsset(asset: unknown): asset is ImageAsset {
	return (
		typeof asset === 'object' &&
		asset !== null &&
		'url' in asset &&
		'_type' in asset &&
		asset._type === 'sanity.imageAsset'
	);
}

/**
 * Renders a Sanity image with next/image, supporting both dereferenced and
 * referenced assets. Dereferenced assets carry blurhash metadata for
 * placeholder blur. Alt text is sourced from the `altText` field populated
 * by the Sanity media plugin; falls back to the `alt` prop, then empty.
 *
 * @param props - Image props matching Sanity image schema plus next/image options
 * @returns A next/image element pointing at the Sanity CDN
 */
export default function SmartImage({
	image,
	width,
	height,
	fill,
	alt,
	...rest
}: SmartImageProps) {
	const { asset } = image;
	const isDereferenced = isDereferencedAsset(asset);

	if (!isDereferenced && process.env.NODE_ENV !== 'production') {
		console.warn(
			'SmartImage: asset is not dereferenced, dereference it in your GROQ query for blurhash support.',
			{ reference: asset._ref },
		);
	}

	const imageAsset = isDereferenced
		? asset
		: getImage(image, { projectId, dataset }).asset;

	const hasCropOrHotspot = Boolean(image.crop || image.hotspot);
	const blurHash = isDereferenced ? imageAsset.metadata.blurHash : undefined;
	const dimensions = imageAsset.metadata.dimensions;
	const altText = isDereferenced ? asset.altText : undefined;

	return (
		<Image
			src={buildOptimizedImageUrl(
				hasCropOrHotspot ? urlFor(image).url() : imageAsset.url,
				{ width, height },
			)}
			alt={altText || alt || ''}
			width={fill ? undefined : (width ?? dimensions?.width)}
			height={fill ? undefined : (height ?? dimensions?.height)}
			placeholder={blurHash ? 'blur' : undefined}
			blurDataURL={blurHash ? blurhashToBase64(blurHash) : undefined}
			fill={fill}
			{...rest}
		/>
	);
}
