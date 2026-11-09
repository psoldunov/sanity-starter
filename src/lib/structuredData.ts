import type { PageSchemaType } from '@/config/llm';
import { toAbsoluteUrl } from '@/lib/url';

/*
 * schema.org structured data, rendered as JSON-LD by `JsonLd`
 * (`src/components/utility/JsonLd.tsx`), following Next's guide
 * (`node_modules/next/dist/docs/01-app/02-guides/json-ld.md`).
 *
 * The site graph (the organisation and the website) is emitted once, by the
 * `(site)` layout, so it is on every page. Each page and post adds its own
 * graph that points back at it by `@id`. Node ids are URLs with a fragment,
 * which is how separate `<script>` blocks on one page join into one graph.
 *
 * Pure functions with no React and no Sanity client, so they stay testable.
 * Nothing here invents facts the CMS does not hold.
 */

/** One schema.org node. */
export type JsonLdNode = {
	'@type': string | readonly string[];
	'@id'?: string;
	[property: string]: unknown;
};

/** A JSON-LD document holding a graph of nodes. */
export type JsonLdGraph = {
	'@context': 'https://schema.org';
	'@graph': JsonLdNode[];
};

/** One question and its answer, as the FAQ section stores them. */
type FaqEntry = {
	question?: string | null;
	answer?: string | null;
};

type SiteJsonLdInput = {
	/** Origin with no trailing slash, from `getSiteUrl()`. */
	siteUrl: string;
	name: string;
	description?: string | null;
	/** Absolute URL of the logo, when settings have one. */
	logoUrl?: string | null;
	/** The organisation's profiles on other sites. */
	sameAs?: readonly (string | null | undefined)[] | null;
	/** BCP 47 language tag, `SITE_LOCALE.language`. */
	language: string;
};

type PageJsonLdInput = {
	siteUrl: string;
	/** Normalised route, e.g. `/` or `/about`. */
	path: string;
	/** The page's own name, without the site-name suffix of its `<title>`. */
	name: string;
	description?: string | null;
	/** Absolute URL of the page's share image. */
	imageUrl?: string;
	language: string;
	/** Label of the first breadcrumb, the home page. */
	homeName: string;
	/** Questions answered on the page; any complete one makes it an `FAQPage`. */
	faqs?: readonly FaqEntry[];
	/** The page type an editor picked (`geo.schemaType`); `WebPage` when unset. */
	type?: PageSchemaType | null;
	/** The document's `_updatedAt`. */
	dateModified?: string | null;
};

type PostJsonLdInput = {
	siteUrl: string;
	/** The post's route, e.g. `/posts/hello`. */
	path: string;
	headline: string;
	description?: string | null;
	/** Absolute URL of the cover image. */
	imageUrl?: string | null;
	datePublished?: string | null;
	dateModified?: string | null;
	language: string;
	/** The site name: the home breadcrumb, and the post's author and publisher. */
	siteName: string;
	logoUrl?: string | null;
	/** The listing the post sits in, as the middle breadcrumb. */
	index?: { name: string; path: string };
};

const CONTEXT = 'https://schema.org';

/**
 * The `@id` of the organisation node, for other nodes to reference.
 *
 * @param siteUrl - Origin with no trailing slash.
 * @returns The node id.
 */
function organizationId(siteUrl: string): string {
	return `${siteUrl}/#organization`;
}

/**
 * The `@id` of the website node, for other nodes to reference.
 *
 * @param siteUrl - Origin with no trailing slash.
 * @returns The node id.
 */
function websiteId(siteUrl: string): string {
	return `${siteUrl}/#website`;
}

/**
 * The base a document's fragment ids hang off. The home URL is the bare
 * origin, but its ids still need the slash the site nodes' have, or they read
 * `https://example.com#webpage`.
 *
 * @param siteUrl - Origin with no trailing slash.
 * @param path - Normalised route.
 * @returns The id base.
 */
function idBase(siteUrl: string, path: string): string {
	return path === '/' ? `${siteUrl}/` : toAbsoluteUrl(siteUrl, path);
}

/**
 * An image as a schema.org `ImageObject`.
 *
 * @param url - The image URL.
 * @returns The node, or `undefined` without a URL.
 */
function imageObject(url: string | null | undefined): JsonLdNode | undefined {
	return url ? { '@type': 'ImageObject', url } : undefined;
}

/**
 * Serialises a JSON-LD document for an inline `<script>`.
 *
 * SECURITY: the graph carries CMS copy, and `JSON.stringify` does not escape
 * `<`, so a `</script>` in a title would end the tag early and run whatever
 * follows it. Writing `<` as `\u003c` — which JSON parsers read back as the
 * same character — closes that hole. `JsonLd` renders this through
 * `dangerouslySetInnerHTML`, so this escape is the only thing between an
 * editor's text and the page's script context.
 *
 * @param data - The document to serialise.
 * @returns JSON safe to place inside `<script type="application/ld+json">`.
 */
export function serializeJsonLd(data: JsonLdGraph): string {
	return JSON.stringify(data).replace(/</g, '\\u003c');
}

/**
 * The site-wide graph: the organisation behind the site and the website itself.
 *
 * @param input - Site settings and resolved URLs.
 * @returns The `Organization` and `WebSite` nodes.
 */
export function buildSiteJsonLd({
	siteUrl,
	name,
	description,
	logoUrl,
	sameAs,
	language,
}: SiteJsonLdInput): JsonLdGraph {
	const profiles = (sameAs ?? []).filter((url): url is string => Boolean(url));

	return {
		'@context': CONTEXT,
		'@graph': [
			{
				'@type': 'Organization',
				'@id': organizationId(siteUrl),
				name,
				url: siteUrl,
				description: description || undefined,
				logo: imageObject(logoUrl),
				sameAs: profiles.length ? profiles : undefined,
			},
			{
				'@type': 'WebSite',
				'@id': websiteId(siteUrl),
				name,
				url: siteUrl,
				description: description || undefined,
				inLanguage: language,
				publisher: { '@id': organizationId(siteUrl) },
			},
		],
	};
}

/**
 * FAQ entries as schema.org `Question` nodes. An entry missing its question or
 * its answer is dropped: a `Question` without an `acceptedAnswer` is invalid.
 *
 * @param faqs - The entries, as the FAQ section stores them.
 * @returns The complete questions.
 */
function toQuestions(faqs: readonly FaqEntry[]): JsonLdNode[] {
	return faqs.flatMap(({ question, answer }) =>
		question?.trim() && answer?.trim()
			? [
					{
						'@type': 'Question',
						name: question.trim(),
						acceptedAnswer: { '@type': 'Answer', text: answer.trim() },
					},
				]
			: [],
	);
}

/**
 * A breadcrumb trail that starts at the home page.
 *
 * @param id - The node's `@id`.
 * @param siteUrl - Origin with no trailing slash.
 * @param homeName - Label of the home crumb.
 * @param crumbs - The crumbs after home, in order, ending at the current page.
 * @returns The `BreadcrumbList` node.
 */
function breadcrumbList(
	id: string,
	siteUrl: string,
	homeName: string,
	crumbs: readonly { name: string; url: string }[],
): JsonLdNode {
	return {
		'@type': 'BreadcrumbList',
		'@id': id,
		itemListElement: [{ name: homeName, url: siteUrl }, ...crumbs].map(
			({ name, url }, index) => ({
				'@type': 'ListItem',
				position: index + 1,
				name,
				item: url,
			}),
		),
	};
}

/**
 * One page's graph: the page itself, as the type its editor picked — an
 * `FAQPage` as well when it answers questions — and, below the home page, its
 * breadcrumb trail.
 *
 * @param input - The page's fields and resolved URLs.
 * @returns The page's nodes.
 */
export function buildPageJsonLd({
	siteUrl,
	path,
	name,
	description,
	imageUrl,
	language,
	homeName,
	faqs = [],
	type,
	dateModified,
}: PageJsonLdInput): JsonLdGraph {
	const url = toAbsoluteUrl(siteUrl, path);
	const isHome = path === '/';
	const base = idBase(siteUrl, path);
	const questions = toQuestions(faqs);
	const breadcrumbId = `${base}#breadcrumb`;

	const page: JsonLdNode = {
		'@type': questions.length
			? [type || 'WebPage', 'FAQPage']
			: type || 'WebPage',
		'@id': `${base}#webpage`,
		url,
		name,
		description: description || undefined,
		inLanguage: language,
		dateModified: dateModified || undefined,
		isPartOf: { '@id': websiteId(siteUrl) },
		about: isHome ? { '@id': organizationId(siteUrl) } : undefined,
		primaryImageOfPage: imageObject(imageUrl),
		breadcrumb: isHome ? undefined : { '@id': breadcrumbId },
		mainEntity: questions.length ? questions : undefined,
	};

	return {
		'@context': CONTEXT,
		'@graph': isHome
			? [page]
			: [
					page,
					breadcrumbList(breadcrumbId, siteUrl, homeName, [{ name, url }]),
				],
	};
}

/**
 * One post's graph: the `BlogPosting` and its breadcrumb trail. The
 * organisation stands as author too: the post schema has no author field, and
 * schema.org accepts an `Organization` there. It is spelled out rather than
 * only referenced, so the article reads whole on its own.
 *
 * @param input - The post's fields and resolved URLs.
 * @returns The post's nodes.
 */
export function buildPostJsonLd({
	siteUrl,
	path,
	headline,
	description,
	imageUrl,
	datePublished,
	dateModified,
	language,
	siteName,
	logoUrl,
	index,
}: PostJsonLdInput): JsonLdGraph {
	const url = toAbsoluteUrl(siteUrl, path);
	const breadcrumbId = `${url}#breadcrumb`;
	const organization: JsonLdNode = {
		'@type': 'Organization',
		'@id': organizationId(siteUrl),
		name: siteName,
		url: siteUrl,
		logo: imageObject(logoUrl),
	};
	const crumbs = [
		...(index
			? [{ name: index.name, url: toAbsoluteUrl(siteUrl, index.path) }]
			: []),
		{ name: headline, url },
	];

	return {
		'@context': CONTEXT,
		'@graph': [
			{
				'@type': 'BlogPosting',
				'@id': `${url}#article`,
				mainEntityOfPage: url,
				url,
				headline,
				description: description || undefined,
				image: imageUrl || undefined,
				datePublished: datePublished || undefined,
				dateModified: dateModified || undefined,
				inLanguage: language,
				isPartOf: { '@id': websiteId(siteUrl) },
				author: organization,
				publisher: organization,
			},
			breadcrumbList(breadcrumbId, siteUrl, siteName, crumbs),
		],
	};
}
