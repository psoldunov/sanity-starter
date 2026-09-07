/**
 * Public Sanity environment configuration.
 *
 * Everything here is `NEXT_PUBLIC_*` and therefore inlined into the client
 * bundle by Next — it is public by design. Secrets never belong in this file;
 * they live in `src/sanity/env.server.ts`, which is server-only.
 *
 * Values are validated at module load so a misconfigured project fails at build
 * time with a readable message, rather than at request time with an opaque
 * Sanity client error.
 */

/**
 * Sanity API version used when none is configured. Pin your own in
 * `NEXT_PUBLIC_SANITY_API_VERSION` — see https://www.sanity.io/docs/api-versioning
 */
const DEFAULT_API_VERSION = '2026-01-22';

/**
 * Reads a required environment variable, throwing a message that names the
 * variable and where to set it.
 *
 * @param name - Environment variable name.
 * @param value - The value read from `process.env`.
 * @returns The non-empty value.
 */
function required(name: string, value: string | undefined): string {
	if (!value) {
		throw new Error(
			`Missing environment variable ${name}. Copy .env.example to .env.local and fill it in — see docs/configuration.md.`,
		);
	}
	return value;
}

export const projectId = required(
	'NEXT_PUBLIC_SANITY_PROJECT_ID',
	process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
);

export const dataset = required(
	'NEXT_PUBLIC_SANITY_DATASET',
	process.env.NEXT_PUBLIC_SANITY_DATASET,
);

export const apiVersion =
	process.env.NEXT_PUBLIC_SANITY_API_VERSION || DEFAULT_API_VERSION;

/** Path the embedded Studio is mounted at. Used for stega source links. */
export const studioUrl = '/admin';
