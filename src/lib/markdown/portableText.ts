import { portableTextToMarkdown } from '@portabletext/markdown';
import { isDereferencedAsset, resolveAltText } from '@/lib/image';
import { image, linkTarget } from '@/lib/markdown/format';
import { absoluteUrl } from '@/lib/markdown/links';
import type { PublishedPost } from '@/types';

/** A post body: text blocks and `contentImage`s. */
type PostContent = PublishedPost['content'];

/** A `contentImage` as `POST_QUERY` projects it: `asset->` dereferenced. */
type ContentImage = Extract<PostContent[number], { _type: 'contentImage' }>;

/**
 * The `link` mark renderer: an absolute URL, since the markdown is read away
 * from the page it came from. A link with no `href` keeps its text.
 *
 * @param siteUrl - The site origin, without a trailing slash.
 * @returns The `marks` option for `portableTextToMarkdown`.
 */
function linkMarks(siteUrl: string) {
	return {
		link: ({
			value: mark,
			children,
		}: {
			value?: { href?: unknown };
			children: string;
		}) => {
			const href =
				typeof mark?.href === 'string'
					? absoluteUrl(mark.href, siteUrl)
					: undefined;
			return href ? `[${children}](${linkTarget(href)})` : children;
		},
	};
}

/**
 * Rich text with only text blocks (lists, bold, links) as Markdown, for
 * fields such as an FAQ answer. Unknown block types are dropped.
 *
 * @param value - Portable Text blocks.
 * @param siteUrl - The site origin, without a trailing slash.
 * @returns The Markdown, or an empty string when there is nothing.
 */
export function richTextToMarkdown(
	value: readonly unknown[] | null | undefined,
	siteUrl: string,
): string {
	if (!value?.length) return '';

	return portableTextToMarkdown(
		value as Parameters<typeof portableTextToMarkdown>[0],
		{
			marks: linkMarks(siteUrl),
			unknownType: () => '',
		},
	);
}

/**
 * Portable Text as Markdown, through `@portabletext/markdown`.
 *
 * Two renderers are overridden: a `contentImage` is written with the alt text
 * `RichText` would render, then its caption in italics, and a link gets an
 * absolute URL, since the markdown is read away from the page it came from.
 * Any other custom type is dropped rather than dumped as the package's JSON
 * fallback — add a renderer for each block type you add to the post schema.
 *
 * @param value - A post's `content`.
 * @param siteUrl - The site origin, without a trailing slash.
 * @returns The Markdown, or an empty string when there is no content.
 */
export function postBodyToMarkdown(
	value: PostContent | null | undefined,
	siteUrl: string,
): string {
	if (!value?.length) return '';

	return portableTextToMarkdown(value, {
		types: {
			contentImage: ({ value: field }: { value: ContentImage }) => {
				const asset = field.asset;
				if (!isDereferencedAsset(asset)) return '';

				const alt = resolveAltText({
					altText: asset.altText,
					caption: field.caption,
				});
				const caption = field.caption?.trim();
				return [image(alt, asset.url), caption ? `*${caption}*` : '']
					.filter(Boolean)
					.join('\n\n');
			},
		},
		marks: linkMarks(siteUrl),
		unknownType: () => '',
	});
}
