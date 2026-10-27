import { cache } from 'react';
import { sanityFetch } from '@/sanity/lib/live';
import {
	LLM_PAGES_QUERY,
	LLM_POSTS_QUERY,
	PAGE_QUERY,
	POST_QUERY,
	REDIRECT_QUERY,
	SITE_SETTINGS_QUERY,
} from '@/sanity/lib/queries';

/**
 * Cached read helpers.
 *
 * Each of these is read at least twice per request — once by `generateMetadata`
 * and once by the component that renders the result. `React.cache()` memoises
 * each helper for the lifetime of a single render pass, so repeat calls to the
 * *same* helper are free.
 *
 * Metadata variants pass `stega: false`. Stega encodes invisible click-to-edit
 * characters into strings, which is what makes Presentation work — and what
 * corrupts a `<title>` or `og:description` if it reaches `<head>`. That is what
 * forces the split: a metadata helper and its rendering counterpart are two
 * distinct `cache()` wrappers with two distinct memo tables, so `React.cache()`
 * dedupes nothing *between* them. In production the round trip is saved by
 * Next's Data Cache instead, which sees one identical request URL from both
 * sides once stega is off. In draft mode the two differ and it genuinely is two
 * fetches — the correct trade for not corrupting `<head>`.
 */

/** Site settings for rendering. Stega-encoded in draft mode. */
export const getSettings = cache(async () => {
	const { data } = await sanityFetch({ query: SITE_SETTINGS_QUERY });
	return data;
});

/** Site settings for `<head>`. Never stega-encoded. */
export const getSettingsForMetadata = cache(async () => {
	const { data } = await sanityFetch({
		query: SITE_SETTINGS_QUERY,
		stega: false,
	});
	return data;
});

/**
 * A page and its section tree.
 *
 * @param slug - Normalised route, e.g. `/about`.
 * @returns The page, or `null` when no page owns that route.
 */
export const getPage = cache(async (slug: string) => {
	const { data } = await sanityFetch({ query: PAGE_QUERY, params: { slug } });
	return data;
});

/**
 * A page projected for `<head>`, with stega disabled.
 *
 * @param slug - Normalised route, e.g. `/about`.
 * @returns The page, or `null` when no page owns that route.
 */
export const getPageForMetadata = cache(async (slug: string) => {
	const { data } = await sanityFetch({
		query: PAGE_QUERY,
		params: { slug },
		stega: false,
	});
	return data;
});

/**
 * A post and its body.
 *
 * @param slug - Post slug, without the `/posts` prefix.
 * @returns The post, or `null` when no post owns that slug.
 */
export const getPost = cache(async (slug: string) => {
	const { data } = await sanityFetch({ query: POST_QUERY, params: { slug } });
	return data;
});

/**
 * A post projected for `<head>`, with stega disabled.
 *
 * @param slug - Post slug, without the `/posts` prefix.
 * @returns The post, or `null` when no post owns that slug.
 */
export const getPostForMetadata = cache(async (slug: string) => {
	const { data } = await sanityFetch({
		query: POST_QUERY,
		params: { slug },
		stega: false,
	});
	return data;
});

/*
 * Published reads, for the LLM layer: a document's markdown and the index files
 * built from it.
 *
 * Passing both `stega: false` and `perspective: 'published'` is what keeps
 * `sanityFetch` from reading the draft-mode cookie, so the route handlers that
 * call these stay static. Drafts never reach an agent: the markdown describes
 * the site as it is published.
 */

/**
 * A published page and its section tree, for its markdown.
 *
 * @param slug - Normalised route, e.g. `/about`.
 * @returns The page, or `null` when no page owns that route.
 */
export const getPublishedPage = cache(async (slug: string) => {
	const { data } = await sanityFetch({
		query: PAGE_QUERY,
		params: { slug },
		stega: false,
		perspective: 'published',
	});
	return data;
});

/**
 * A published post and its body, for its markdown.
 *
 * @param slug - Post slug, without the `/posts` prefix.
 * @returns The post, or `null` when no post owns that slug.
 */
export const getPublishedPost = cache(async (slug: string) => {
	const { data } = await sanityFetch({
		query: POST_QUERY,
		params: { slug },
		stega: false,
		perspective: 'published',
	});
	return data;
});

/**
 * Published site settings, for the markdown and the index files.
 *
 * @returns The settings, or `null` before the singleton is published.
 */
export const getPublishedSettings = cache(async () => {
	const { data } = await sanityFetch({
		query: SITE_SETTINGS_QUERY,
		stega: false,
		perspective: 'published',
	});
	return data;
});

/**
 * Every published page search engines may index, for the markdown's static
 * params and the index files.
 *
 * @returns The pages, ordered by route.
 */
export const getIndexablePages = cache(async () => {
	const { data } = await sanityFetch({
		query: LLM_PAGES_QUERY,
		stega: false,
		perspective: 'published',
	});
	return data;
});

/**
 * Every published post search engines may index, for the markdown's static
 * params and the index files.
 *
 * @returns The posts, newest first.
 */
export const getIndexablePosts = cache(async () => {
	const { data } = await sanityFetch({
		query: LLM_POSTS_QUERY,
		stega: false,
		perspective: 'published',
	});
	return data;
});

/**
 * The published redirect rules that could handle a route, so a markdown
 * request for a moved page follows it as the HTML request does.
 *
 * @param slug - Normalised route, e.g. `/about`.
 * @returns The candidate rules; `resolveRedirect` picks the winner.
 */
export const getPublishedRedirects = cache(async (slug: string) => {
	const { data } = await sanityFetch({
		query: REDIRECT_QUERY,
		params: { slug },
		stega: false,
		perspective: 'published',
	});
	return data;
});
