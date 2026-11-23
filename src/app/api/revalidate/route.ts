import { isValidSignature, SIGNATURE_HEADER_NAME } from '@sanity/webhook';
import { revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import { isFreshSignatureTimestamp } from '@/lib/webhook';
import { revalidateSecret } from '@/sanity/env.server';
import { SANITY_CACHE_TAG } from '@/sanity/lib/live';

/**
 * Sanity webhook target: expires every cached Sanity read when content is
 * created, updated or deleted, so a publish reaches production without a
 * visitor holding a `<SanityLive>` connection open. Setup: docs/configuration.md.
 *
 * `{ expire: 0 }` rather than `'max'`: a deleted page must stop being served at
 * once, not once more while it regenerates (Next's revalidateTag docs, webhooks).
 *
 * @param request - The signed webhook request from Sanity.
 * @returns 200 once revalidated; 401 on a bad signature; 500 when unconfigured.
 */
export async function POST(request: NextRequest): Promise<Response> {
	if (!revalidateSecret) {
		console.error(
			'Revalidation webhook called but SANITY_REVALIDATE_SECRET is not set.',
		);
		return Response.json(
			{ message: 'Revalidation is not configured' },
			{ status: 500 },
		);
	}

	const signature = request.headers.get(SIGNATURE_HEADER_NAME);
	if (!signature || !isFreshSignatureTimestamp(signature, Date.now())) {
		return Response.json({ message: 'Invalid signature' }, { status: 401 });
	}

	const body = await request.text();
	if (!(await isValidSignature(body, signature, revalidateSecret.trim()))) {
		return Response.json({ message: 'Invalid signature' }, { status: 401 });
	}

	revalidateTag(SANITY_CACHE_TAG, { expire: 0 });
	return Response.json({ revalidated: true });
}
