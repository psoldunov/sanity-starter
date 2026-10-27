/**
 * Markdown building blocks for the section and document serializers.
 *
 * Plain string helpers with no imports, so anything that serializes a page can
 * use them without pulling in React, the Sanity client or a component. Text
 * from the CMS is not escaped: it is prose written for people, and escaping
 * every `*` and `1.` would make it worse for the models reading it.
 */

/** A string field that may be empty, as most Sanity fields can be. */
export type Text = string | null | undefined;

/**
 * Collapses a field onto one line, for a heading, a list item or an alt text.
 *
 * @param text - The field value.
 * @returns The trimmed text with every line break turned into a space.
 */
export function inline(text: Text): string {
	return (text ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Paragraph text, with the editor's line breaks kept.
 *
 * @param text - The field value.
 * @returns The trimmed text.
 */
export function prose(text: Text): string {
	return (text ?? '').trim();
}

/**
 * Joins blocks with a blank line between them, dropping the empty ones.
 *
 * @param parts - Blocks, or lists of blocks, in reading order.
 * @returns The joined Markdown.
 */
export function blocks(...parts: Array<Text | Text[]>): string {
	return parts
		.flat()
		.filter((part): part is string => Boolean(part?.trim()))
		.join('\n\n');
}

/**
 * An ATX heading.
 *
 * @param level - 1 to 6.
 * @param text - The heading text.
 * @returns The heading, or an empty string when there is no text.
 */
export function heading(level: number, text: Text): string {
	const value = inline(text);
	return value ? `${'#'.repeat(level)} ${value}` : '';
}

/**
 * A bullet list. Empty items are dropped.
 *
 * @param items - The items, already formatted.
 * @returns The list, or an empty string when no item has text.
 */
export function bulletList(items: Text[]): string {
	return items
		.map(inline)
		.filter(Boolean)
		.map((item) => `- ${item}`)
		.join('\n');
}

/**
 * A link destination as Markdown writes it: wrapped in `<…>` when a space or a
 * parenthesis would otherwise end it early.
 *
 * @param url - The URL.
 * @returns The destination, ready to go between `(` and `)`.
 */
export function linkTarget(url: string): string {
	return /[\s()]/.test(url) ? `<${url}>` : url;
}

/**
 * An inline link. Without a URL the label stands alone, so the copy survives
 * a link an editor has not finished.
 *
 * @param label - The link text.
 * @param url - The absolute URL, if the link resolved to one.
 * @returns The link, or the bare label.
 */
export function linkTo(label: Text, url: string | undefined): string {
	const text = inline(label);
	if (!url) return text;

	return `[${text.replace(/[[\]]/g, '\\$&') || url}](${linkTarget(url)})`;
}

/**
 * An image. Only an image with alt text is written: a model learns nothing
 * from a bare URL, and decorative images have no alt text by design.
 *
 * @param alt - The alt text.
 * @param url - The image's CDN URL.
 * @returns The image, or an empty string without alt text or a URL.
 */
export function image(alt: Text, url: Text): string {
	const text = inline(alt).replace(/[[\]]/g, '\\$&');
	return text && url ? `![${text}](${linkTarget(url)})` : '';
}

/**
 * YAML front matter. Each value is written as a JSON string, which is also a
 * valid YAML double-quoted scalar, so a colon or quote in a title is safe.
 *
 * @param fields - The fields, in order. An empty one is left out.
 * @returns The front matter block, fences included.
 */
export function frontMatter(fields: Record<string, string>): string {
	const lines = Object.entries(fields)
		.filter(([, value]) => value !== '')
		.map(([key, value]) => `${key}: ${JSON.stringify(value)}`);
	return ['---', ...lines, '---'].join('\n');
}
