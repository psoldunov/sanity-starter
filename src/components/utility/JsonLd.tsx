import { type JsonLdGraph, serializeJsonLd } from '@/lib/structuredData';

/**
 * A JSON-LD graph as a `<script>` tag, the way Next's JSON-LD guide renders
 * it. Build the graph with `src/lib/structuredData.ts`.
 *
 * @param props.data - The graph, from `buildSiteJsonLd`, `buildPageJsonLd` or
 *   `buildPostJsonLd`.
 * @returns The script tag.
 */
export default function JsonLd({ data }: { data: JsonLdGraph }) {
	return (
		<script
			type='application/ld+json'
			// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD has to be the script's raw text; `serializeJsonLd` escapes `<` so CMS copy cannot close the tag.
			dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
		/>
	);
}
