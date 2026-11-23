import { isDereferencedAsset, resolveAltText } from '@/lib/image';
import { image, type Text } from '@/lib/markdown/format';

/** An image field as `PAGE_QUERY` projects it: `asset->` dereferenced. */
type ImageField = {
	asset?: unknown;
	caption?: Text;
} | null;

/**
 * An image as markdown, with the alt text `SmartImage` would render. Shared by
 * the section serializers in `src/sections/<name>/markdown.ts`.
 *
 * @param field - The image field.
 * @returns The image, or an empty string when it has no alt text or asset.
 */
export function sectionImage(field: ImageField | undefined): string {
	const asset = field?.asset;
	if (!isDereferencedAsset(asset)) return '';

	const alt = resolveAltText({
		altText: asset.altText,
		caption: field?.caption,
	});
	return image(alt, asset.url);
}
