import { isDereferencedAsset, resolveAltText } from '@/lib/image';
import { documentPath } from '@/lib/links';
import {
	blocks,
	frontMatter,
	heading,
	image,
	inline,
	prose,
	type Text,
} from '@/lib/markdown/format';
import { postBodyToMarkdown } from '@/lib/markdown/portableText';
import {
	type MarkdownContext,
	sectionToMarkdown,
} from '@/lib/markdown/sections';
import type { PublishedPage, PublishedPost } from '@/types';

/**
 * The fields an index entry and a document's front matter read, which the
 * full documents and the index queries (`LLM_PAGES_QUERY`, `LLM_POSTS_QUERY`)
 * both carry.
 */
export type DocumentSummary = {
	title: Text;
	metaTitle: Text;
	metaDescription: Text;
	llmsSummary: Text;
	excerpt?: Text;
};

/** Everything a document's markdown needs besides the document. */
export type DocumentMarkdownContext = MarkdownContext & {
	/** The site description, which a document's own falls back to, as in `<head>`. */
	siteDescription?: string | null;
};

/**
 * A document's title as an index lists it: its meta title, else its title.
 *
 * @param document - The page or post.
 * @param fallback - Used when both are empty, e.g. the route.
 * @returns The title.
 */
export function documentTitle(
	document: DocumentSummary,
	fallback: string,
): string {
	return inline(document.metaTitle || document.title || fallback);
}

/**
 * A document's description for agents: the editor's summary for AI agents,
 * then the same chain `generateMetadata` uses.
 *
 * @param document - The page or post.
 * @param siteDescription - The site-wide description.
 * @returns The description, or an empty string.
 */
export function documentDescription(
	document: DocumentSummary,
	siteDescription: string | null | undefined,
): string {
	return inline(
		document.llmsSummary ||
			document.metaDescription ||
			document.excerpt ||
			siteDescription,
	);
}

/**
 * A page as Markdown: YAML front matter, then every visible section in order.
 *
 * Built from the section data rather than the rendered HTML, so the copy reads
 * as copy and design-only markup never reaches the model.
 *
 * @param page - The page, as `PAGE_QUERY` returns it, read without stega.
 * @param context - The site URL and description.
 * @returns The document, ending in a newline.
 */
export function pageToMarkdown(
	page: PublishedPage,
	context: DocumentMarkdownContext,
): string {
	const route = page.route ?? '/';
	const summary = { ...page, llmsSummary: page.geo?.llmsSummary };

	const fields = {
		title: documentTitle(summary, route),
		description: documentDescription(summary, context.siteDescription),
		url: route === '/' ? context.siteUrl : `${context.siteUrl}${route}`,
		updated: page._updatedAt.slice(0, 10),
	};

	const body = blocks(
		(page.sections ?? [])
			.filter((section) => !section.hidden)
			.map((section) => sectionToMarkdown(section, context)),
	);

	return `${frontMatter(fields)}\n\n${body}\n`;
}

/**
 * A post as Markdown: front matter, then the article as its template shows
 * it — title, excerpt, cover image, body.
 *
 * @param post - The post, as `POST_QUERY` returns it, read without stega.
 * @param context - The site URL and description.
 * @returns The document, ending in a newline.
 */
export function postToMarkdown(
	post: PublishedPost,
	context: DocumentMarkdownContext,
): string {
	const path = documentPath('post', post.slug ?? undefined);
	const summary = { ...post, llmsSummary: post.geo?.llmsSummary };
	const cover = post.coverImage?.asset;

	const fields = {
		title: documentTitle(summary, path),
		description: documentDescription(summary, context.siteDescription),
		url: `${context.siteUrl}${path}`,
		published: post.publishedAt?.slice(0, 10) ?? '',
		updated: post._updatedAt.slice(0, 10),
	};

	const body = blocks(
		heading(1, post.title),
		prose(post.excerpt),
		isDereferencedAsset(cover)
			? image(resolveAltText({ altText: cover.altText }), cover.url)
			: '',
		postBodyToMarkdown(post.content, context.siteUrl),
	);

	return `${frontMatter(fields)}\n\n${body}\n`;
}
