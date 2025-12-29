import { getImage } from '@sanity/asset-utils';
import { blurhashToBase64 } from 'blurhash-base64';
import Image from 'next/image';
import type { ImageAsset } from 'sanity';
import { buildOptimizedImageUrl } from '@/lib/utils';
import { dataset, projectId } from '@/sanity/env';
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

export default function SmartImage({
	image,
	width,
	height,
	className,
	quality,
	priority,
	fill,
	sizes,
}: SmartImageProps) {
	const { asset } = image;
	const isDereferenced = isDereferencedAsset(asset);

	!isDereferenced &&
		console.warn(
			'SanityImage is not dereferenced, please dereference the asset in your GROQ query.',
			{ reference: asset._ref },
		);

	const imageAsset = isDereferenced
		? asset
		: getImage(image, { projectId, dataset }).asset;

	const blurHash = isDereferenced ? imageAsset.metadata.blurHash : undefined;
	const dimensions = imageAsset.metadata.dimensions;
	const altText =
		isDereferenced && 'altText' in asset ? asset.altText : undefined;

	return (
		<Image
			src={buildOptimizedImageUrl(imageAsset.url, {
				width,
				height,
			})}
			alt={altText || ''}
			width={!fill ? width || dimensions?.width : undefined}
			height={!fill ? height || dimensions?.height : undefined}
			placeholder={blurHash ? 'blur' : undefined}
			blurDataURL={blurHash ? blurhashToBase64(blurHash) : undefined}
			className={className}
			quality={quality}
			priority={priority}
			sizes={sizes}
			fill={fill}
		/>
	);
}
