import { defineLive } from 'next-sanity/live';
import { readToken } from '../env.server';
import { client } from './client';

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
export const { sanityFetch, SanityLive } = defineLive({
	client,
	serverToken: readToken || false,
	browserToken: readToken || false,
});
