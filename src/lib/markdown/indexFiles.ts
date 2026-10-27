import { documentPath } from '@/lib/links';
import {
	type DocumentSummary,
	documentDescription,
	documentTitle,
} from '@/lib/markdown/document';
import {
	blocks,
	bulletList,
	heading,
	inline,
	linkTo,
	type Text,
} from '@/lib/markdown/format';
import { htmlPathToMarkdownPath } from '@/lib/markdown/paths';

/** One document an index lists. */
export type IndexEntry = { title: string; url: string; description: string };

/** A `## Heading` of entries, such as `Pages`. */
export type IndexGroup = { title: string; entries: IndexEntry[] };

/** `geo.llmsListing`: `listed` (also when unset), `optional` or `unlisted`. */
type Listing = string | null | undefined;

/** A page as `LLM_PAGES_QUERY` returns it. */
type IndexablePage = DocumentSummary & { route: Text; llmsListing: Listing };

/** A post as `LLM_POSTS_QUERY` returns it. */
type IndexablePost = DocumentSummary & { slug: Text; llmsListing: Listing };

/**
 * Whether a document appears in the index files at all. An unlisted document
 * keeps its markdown; it is only left out of the lists.
 *
 * @param listing - The document's `geo.llmsListing`.
 * @returns `false` only for `unlisted`.
 */
export function isListed(listing: Listing): boolean {
	return listing !== 'unlisted';
}

/**
 * The indexable pages and posts as index groups, each entry pointing at the
 * document's markdown: `Pages`, `Posts`, then `Optional`.
 *
 * `Optional` is the one heading llmstxt.org gives a meaning: what an agent may
 * skip when it needs a shorter context. Documents an editor marked optional go
 * there, whatever their type.
 *
 * To list another document type, map it to entries the way posts are mapped
 * and add a group; every index file renders whatever groups it is handed.
 *
 * @param pages - The indexable pages.
 * @param posts - The indexable posts.
 * @param options.siteUrl - The site origin, without a trailing slash.
 * @param options.siteDescription - The fallback for a document with none of its own.
 * @returns The groups, empty ones included.
 */
export function indexGroups(
	pages: IndexablePage[],
	posts: IndexablePost[],
	{
		siteUrl,
		siteDescription,
	}: { siteUrl: string; siteDescription?: string | null },
): IndexGroup[] {
	const entry = (document: DocumentSummary, path: string) => ({
		title: documentTitle(document, path),
		url: `${siteUrl}${htmlPathToMarkdownPath(path)}`,
		description: documentDescription(document, siteDescription),
	});

	const pageItems = pages.flatMap((page) =>
		page.route
			? [{ listing: page.llmsListing, entry: entry(page, page.route) }]
			: [],
	);
	const postItems = posts.flatMap((post) =>
		post.slug
			? [
					{
						listing: post.llmsListing,
						entry: entry(post, documentPath('post', post.slug)),
					},
				]
			: [],
	);

	const pick = (items: typeof pageItems, listing: 'listed' | 'optional') =>
		items
			.filter((item) => (item.listing || 'listed') === listing)
			.map((item) => item.entry);

	return [
		{ title: 'Pages', entries: pick(pageItems, 'listed') },
		{ title: 'Posts', entries: pick(postItems, 'listed') },
		{
			title: 'Optional',
			entries: [...pick(pageItems, 'optional'), ...pick(postItems, 'optional')],
		},
	];
}

/**
 * Renders each group as a heading and a list, skipping empty groups.
 *
 * @param groups - The groups.
 * @param entry - How one entry reads in the list.
 * @returns The Markdown.
 */
function renderGroups(
	groups: IndexGroup[],
	entry: (value: IndexEntry) => string,
): string {
	return blocks(
		groups
			.filter((group) => group.entries.length > 0)
			.map((group) =>
				blocks(heading(2, group.title), bulletList(group.entries.map(entry))),
			),
	);
}

/**
 * `/llms.txt`, in the format llmstxt.org describes: the site name, a one-line
 * summary, then each group's documents with what each is for.
 *
 * @param options.siteName - The site name.
 * @param options.summary - The site description.
 * @param options.groups - The documents to list.
 * @returns The file.
 */
export function llmsTxt({
	siteName,
	summary,
	groups,
}: {
	siteName: string;
	summary?: string | null;
	groups: IndexGroup[];
}): string {
	const description = inline(summary);

	return `${blocks(
		heading(1, siteName),
		description ? `> ${description}` : '',
		renderGroups(groups, ({ title, url, description: text }) =>
			text ? `${linkTo(title, url)}: ${text}` : linkTo(title, url),
		),
	)}\n`;
}

/**
 * `/sitemap.md`: the same groups as `/llms.txt`, links only.
 *
 * @param groups - The documents to list.
 * @returns The file.
 */
export function sitemapMarkdown(groups: IndexGroup[]): string {
	return `${blocks(
		heading(1, 'Sitemap'),
		renderGroups(groups, ({ title, url }) => linkTo(title, url)),
	)}\n`;
}

/**
 * `/llms-full.txt`: every document in full, one after another, divided by a
 * thematic break.
 *
 * @param documents - Each document's markdown, front matter included.
 * @returns The file.
 */
export function llmsFullTxt(documents: string[]): string {
	return `${documents.map((document) => document.trim()).join('\n\n---\n\n')}\n`;
}
