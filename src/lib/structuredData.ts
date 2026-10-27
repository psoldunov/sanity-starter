import type { PAGE_SCHEMA_TYPES } from '@/config/llm';
import { isDereferencedAsset } from '@/lib/image';
import { documentPath } from '@/lib/links';

/*
 * schema.org JSON-LD for search engines and AI agents, following Next's guide
 * (`node_modules/next/dist/docs/01-app/02-guides/json-ld.md`).
 *
 * Every page declares itself as a `WebPage` (or the subtype an editor picked),
 * part of the `WebSite`. The home page also carries the `Organization` and the
 * `WebSite` in full, linked by `@id`, so a reader of any one page can join the
 * graph up. A post is a `BlogPosting` published by that organization.
 *
 * Pure functions with no React and no Sanity client, so they stay testable.
 */

/** A schema.org page type, as `geo.schemaType` stores it. */
type PageSchemaType = (typeof PAGE_SCHEMA_TYPES)[number];

/** The site-wide facts every node hangs off. */
export type SiteFacts = {
	/** The site origin, without a trailing slash. */
	siteUrl: string;
	/** The site name from settings. */
	name: string;
	/** The site description from settings. */
	description?: string | null;
	/** The logo's CDN URL from settings. */
	logoUrl?: string | null;
};

/** One node of a JSON-LD graph. */
type Node = Record<string, unknown>;

/** Site settings as `SITE_SETTINGS_QUERY` returns them, read without stega. */
type SettingsFields = {
	siteName?: string | null;
	siteDescription?: string | null;
	logo?: { asset?: { url?: string | null } | null } | null;
} | null;

/** Page fields as `PAGE_QUERY` returns them, read without stega. */
type PageFields = {
	route?: string | null;
	title?: string | null;
	metaTitle?: string | null;
	metaDescription?: string | null;
	_updatedAt?: string | null;
	geo?: { schemaType?: PageSchemaType | null } | null;
};

/** Post fields as `POST_QUERY` returns them, read without stega. */
type PostFields = {
	slug?: string | null;
	title?: string | null;
	metaTitle?: string | null;
	metaDescription?: string | null;
	excerpt?: string | null;
	publishedAt?: string | null;
	_updatedAt?: string | null;
	coverImage?: { asset?: unknown } | null;
};

/**
 * Serializes a JSON-LD graph for a `<script>` tag.
 *
 * SECURITY: the graph carries CMS copy, and `JSON.stringify` does not escape
 * `<`, so a `</script>` in a title would end the tag early and run whatever
 * follows it. Writing `<` as `<` — which JSON parsers read back as the
 * same character — closes that hole. `JsonLd` renders this through
 * `dangerouslySetInnerHTML`, so this escape is the only thing between an
 * editor's text and the page's script context.
 *
 * @param nodes - The graph's nodes.
 * @returns The payload, safe to put inside a `<script>` tag.
 */
export function serializeJsonLd(nodes: Node[]): string {
	const graph = { '@context': 'https://schema.org', '@graph': nodes };
	return JSON.stringify(graph).replace(/</g, '\\u003c');
}

/**
 * The stable `@id`s the graph links by.
 *
 * @param siteUrl - The site origin, without a trailing slash.
 * @returns The organization's and the website's ids.
 */
function siteIds(siteUrl: string) {
	return {
		organization: `${siteUrl}/#organization`,
		website: `${siteUrl}/#website`,
	};
}

/**
 * The organization behind the site and the site itself, for the home page.
 *
 * @param site - The site facts.
 * @returns The two nodes.
 */
function siteNodes(site: SiteFacts): Node[] {
	const ids = siteIds(site.siteUrl);
	const url = `${site.siteUrl}/`;

	return [
		{
			'@type': 'Organization',
			'@id': ids.organization,
			name: site.name,
			url,
			logo: site.logoUrl || undefined,
			description: site.description || undefined,
		},
		{
			'@type': 'WebSite',
			'@id': ids.website,
			name: site.name,
			url,
			description: site.description || undefined,
			publisher: { '@id': ids.organization },
			inLanguage: 'en',
		},
	];
}

/**
 * One page, as the type its editor picked.
 *
 * @param site - The site facts.
 * @param page.url - The page's canonical URL.
 * @param page.name - Its title.
 * @param page.description - Its description.
 * @param page.type - `geo.schemaType`; `WebPage` when unset.
 * @param page.dateModified - Its `_updatedAt`.
 * @returns The node.
 */
function webPageNode(
	site: SiteFacts,
	page: {
		url: string;
		name?: string | null;
		description?: string | null;
		type?: PageSchemaType | null;
		dateModified?: string | null;
	},
): Node {
	return {
		'@type': page.type || 'WebPage',
		'@id': `${page.url}#webpage`,
		url: page.url,
		name: page.name || undefined,
		description: page.description || undefined,
		dateModified: page.dateModified || undefined,
		isPartOf: {
			'@type': 'WebSite',
			'@id': siteIds(site.siteUrl).website,
			name: site.name,
			url: `${site.siteUrl}/`,
		},
		inLanguage: 'en',
	};
}

/**
 * One post. The organization stands as author too: the post schema has no
 * author field, and schema.org accepts an `Organization` there.
 *
 * @param site - The site facts.
 * @param post.url - The post's canonical URL.
 * @param post.headline - Its title.
 * @param post.description - Its description.
 * @param post.imageUrl - Its cover image's CDN URL.
 * @param post.datePublished - Its publish date.
 * @param post.dateModified - Its `_updatedAt`.
 * @returns The node.
 */
function blogPostingNode(
	site: SiteFacts,
	post: {
		url: string;
		headline?: string | null;
		description?: string | null;
		imageUrl?: string | null;
		datePublished?: string | null;
		dateModified?: string | null;
	},
): Node {
	const organization = {
		'@type': 'Organization',
		'@id': siteIds(site.siteUrl).organization,
		name: site.name,
		url: `${site.siteUrl}/`,
		logo: site.logoUrl || undefined,
	};

	return {
		'@type': 'BlogPosting',
		'@id': `${post.url}#article`,
		mainEntityOfPage: post.url,
		url: post.url,
		headline: post.headline || undefined,
		description: post.description || undefined,
		image: post.imageUrl || undefined,
		datePublished: post.datePublished || undefined,
		dateModified: post.dateModified || undefined,
		author: organization,
		publisher: organization,
		inLanguage: 'en',
	};
}

/**
 * The site facts from settings. Without a site name there is no entity to
 * describe yet, so a route renders no JSON-LD.
 *
 * @param siteUrl - The site origin, without a trailing slash.
 * @param settings - The stega-free site settings.
 * @returns The facts, or `undefined` when the site has no name.
 */
export function siteFacts(
	siteUrl: string,
	settings: SettingsFields,
): SiteFacts | undefined {
	if (!settings?.siteName) return undefined;

	return {
		siteUrl,
		name: settings.siteName,
		description: settings.siteDescription,
		logoUrl: settings.logo?.asset?.url,
	};
}

/**
 * A page's graph: its own node, plus the organization and the website on the
 * home page. Title and description follow the same chain as its `<head>`.
 *
 * @param site - The site facts.
 * @param page - The stega-free page.
 * @returns The nodes.
 */
export function pageNodes(site: SiteFacts, page: PageFields): Node[] {
	const route = page.route || '/';
	const isHome = route === '/';

	const node = webPageNode(site, {
		url: isHome ? `${site.siteUrl}/` : `${site.siteUrl}${route}`,
		name: page.metaTitle || page.title,
		description: page.metaDescription || site.description,
		type: page.geo?.schemaType,
		dateModified: page._updatedAt,
	});

	return isHome ? [...siteNodes(site), node] : [node];
}

/**
 * A post's graph. Title and description follow the same chain as its `<head>`.
 *
 * @param site - The site facts.
 * @param post - The stega-free post.
 * @returns The nodes.
 */
export function postNodes(site: SiteFacts, post: PostFields): Node[] {
	const cover = post.coverImage?.asset;

	return [
		blogPostingNode(site, {
			url: `${site.siteUrl}${documentPath('post', post.slug || undefined)}`,
			headline: post.metaTitle || post.title,
			description: post.metaDescription || post.excerpt,
			imageUrl: isDereferencedAsset(cover) ? cover.url : undefined,
			datePublished: post.publishedAt,
			dateModified: post._updatedAt,
		}),
	];
}
