import { serializeJsonLd } from '@/lib/structuredData';

/**
 * A JSON-LD graph as a `<script>` tag, the way Next's JSON-LD guide renders
 * it. Build the nodes with `src/lib/structuredData.ts`.
 *
 * @param props.nodes - The graph's nodes.
 * @returns The script tag.
 */
export default function JsonLd({
	nodes,
}: {
	nodes: Record<string, unknown>[];
}) {
	return (
		<script
			type='application/ld+json'
			// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD has to be the script's raw text; `serializeJsonLd` escapes `<` so CMS copy cannot close the tag.
			dangerouslySetInnerHTML={{ __html: serializeJsonLd(nodes) }}
		/>
	);
}
