import { defineEnableDraftMode } from 'next-sanity/draft-mode';
import { requireReadToken } from '@/sanity/env.server';
import { client } from '@/sanity/lib/client';

/**
 * Enables draft mode for the Presentation tool and the iframe preview pane.
 *
 * The token is asserted per request rather than at module load. This route is
 * the one place a read token is genuinely required, and it is request-scoped —
 * so a project without one still builds and serves published content, and fails
 * with a readable message only when somebody tries to enter draft mode.
 *
 * @param request - The incoming draft-mode request.
 * @returns The response that sets the draft-mode cookies and redirects.
 */
export async function GET(request: Request): Promise<Response> {
	const { GET: enableDraftMode } = defineEnableDraftMode({
		client: client.withConfig({ token: requireReadToken() }),
	});

	return enableDraftMode(request);
}
