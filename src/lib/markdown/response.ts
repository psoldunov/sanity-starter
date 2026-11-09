const CONTENT_TYPES = {
	markdown: 'text/markdown; charset=utf-8',
	text: 'text/plain; charset=utf-8',
} as const;

/**
 * A response from the LLM layer: a document's markdown or one of the index
 * files.
 *
 * Always `X-Robots-Tag: noindex`: these are copies made for agents, and search
 * engines index the HTML. Every one of them has a URL of its own — a page URL
 * never answers with markdown, it redirects to the `.md` URL (see
 * `next.config.ts`) — so the header can never land on the HTML page itself.
 *
 * @param body - The document.
 * @param options.format - `markdown` or plain `text`.
 * @param options.status - The HTTP status, 200 unless given.
 * @param options.link - A `Link` header, for a route `next.config.ts` leaves
 *   it to (a document's markdown).
 * @returns The response.
 */
export function llmResponse(
	body: string,
	{
		format,
		status = 200,
		link,
	}: { format: keyof typeof CONTENT_TYPES; status?: number; link?: string },
): Response {
	return new Response(body, {
		status,
		headers: {
			'Content-Type': CONTENT_TYPES[format],
			'X-Robots-Tag': 'noindex',
			...(link ? { Link: link } : {}),
		},
	});
}
