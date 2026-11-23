import { PHASE_PRODUCTION_BUILD } from 'next/constants';
import { type DefinedFetchType, defineLive } from 'next-sanity/live';
import { readToken } from '../env.server';
import { client } from './client';

/**
 * Cache tag carried by every Sanity read, so one webhook call
 * (`src/app/api/revalidate/route.ts`) can expire all of them. `defineLive` only
 * tags reads with Sanity sync tags, which only a connected `<SanityLive>` knows.
 */
export const SANITY_CACHE_TAG = 'sanity';

/**
 * `defineLive` caches every read in Next's fetch cache with
 * `revalidate: false`, and that cache persists in `.next/cache` between builds.
 * A build would therefore prerender whatever an earlier build fetched, deleted
 * pages included. Giving build-phase reads a request tag unique to this build
 * changes their URL, and so their cache key: each build fetches fresh content.
 * Runtime reads keep the stable tag, kept fresh by `<SanityLive>` and the webhook.
 */
const REQUEST_TAG =
	process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD
		? `next-loader.fetch.build-${Date.now().toString(36)}`
		: 'next-loader.fetch';

/**
 * Live Content API bindings.
 *
 * `serverToken` lets the server read drafts; `browserToken` is forwarded to the
 * browser by `next-sanity` itself, over its own server-action plumbing, and only
 * when a draft-capable live connection is opened. Neither is ever inlined into a
 * public bundle — which is exactly why the variable behind them must NOT carry a
 * `NEXT_PUBLIC_` prefix.
 *
 * Both fall back to `false` rather than throwing on a missing token. This module
 * exports `sanityFetch`, so the root layout imports it and every route in the
 * site depends on it — throwing here would make a draft-mode credential a
 * requirement for building the published site at all. Without a token, published
 * content still renders and only draft previewing is unavailable; the assertion
 * belongs on the draft-mode route, which is request-scoped.
 */
const live = defineLive({
	client,
	serverToken: readToken || false,
	browserToken: readToken || false,
});

export const { SanityLive } = live;

/** `defineLive`'s `sanityFetch`, with the shared cache tag and the build-scoped request tag. */
export const sanityFetch = ((options: Parameters<DefinedFetchType>[0]) =>
	live.sanityFetch({
		requestTag: REQUEST_TAG,
		...options,
		tags: [...(options.tags ?? []), SANITY_CACHE_TAG],
	})) as DefinedFetchType;
