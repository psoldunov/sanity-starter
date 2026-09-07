import 'server-only';

/**
 * Server-only Sanity credentials.
 *
 * `import 'server-only'` makes any accidental import from a Client Component a
 * build error rather than a leaked token. Nothing in this file may ever be given
 * a `NEXT_PUBLIC_` prefix.
 */

/**
 * Read token used for draft previews and the live-content connection.
 *
 * `next-sanity`'s `defineLive` forwards this to the browser itself, over its own
 * server-action plumbing, and only on the draft-capable path — so the variable
 * stays server-side. Give it Viewer permissions and nothing more.
 */
export const readToken = process.env.SANITY_API_READ_TOKEN || '';

/**
 * Asserts the read token is configured, throwing a message that says how to fix
 * it. Called where draft mode and live content are wired up.
 *
 * @returns The configured read token.
 */
export function requireReadToken(): string {
	if (!readToken) {
		throw new Error(
			'Missing environment variable SANITY_API_READ_TOKEN. Draft mode and live content need a Viewer token — see docs/configuration.md.',
		);
	}
	return readToken;
}
