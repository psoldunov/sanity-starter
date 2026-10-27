import { describe, expect, test } from 'bun:test';
import { serializeJsonLd } from '@/lib/structuredData';

// SECURITY: `JsonLd` (src/components/utility/JsonLd.tsx) renders this through
// `dangerouslySetInnerHTML`, with CMS copy inside. Without the escape, a
// `</script>` in a page title ends the tag and runs whatever follows it.
describe('serializeJsonLd', () => {
	test('cannot be closed by CMS copy, and still parses back', () => {
		const name = '</script><script>alert(1)</script>';
		const payload = serializeJsonLd([{ '@type': 'WebPage', name }]);

		expect(payload).not.toContain('<');
		expect(JSON.parse(payload)['@graph'][0].name).toBe(name);
	});
});
