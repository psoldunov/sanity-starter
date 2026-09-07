import { createClient } from 'next-sanity';
import { apiVersion, dataset, projectId, studioUrl } from '../env';

/**
 * Shared read-only Sanity client.
 *
 * `stega.studioUrl` is what lets `next-sanity` encode click-to-edit source links
 * into returned strings. It is not unconditional: `sanityFetch` only turns stega
 * on when draft mode is enabled, so published traffic is never affected. Fetches
 * feeding `<head>` must still pass `stega: false` explicitly — stega characters
 * in metadata break search results.
 *
 * No token is set here. Draft reads get one from `defineLive` in `./live.ts`,
 * which keeps the credential on the server.
 */
export const client = createClient({
	projectId,
	dataset,
	apiVersion,
	useCdn: true,
	perspective: 'published',
	stega: {
		studioUrl,
	},
});
