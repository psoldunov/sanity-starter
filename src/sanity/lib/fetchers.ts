import { cache } from 'react';
import { sanityFetch } from '@/sanity/lib/live';
import {
	PAGE_QUERY,
	POST_QUERY,
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
