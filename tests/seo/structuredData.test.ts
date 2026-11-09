import { describe, expect, test } from 'bun:test';
import {
	buildPageJsonLd,
	buildPostJsonLd,
	type JsonLdNode,
	serializeJsonLd,
} from '@/lib/structuredData';
import { toAbsoluteUrl } from '@/lib/url';

const SITE = 'https://example.com';
const BASE = { siteUrl: SITE, language: 'en-US', homeName: 'Acme' };

/**
 * The node of a graph with the given `@type`.
 *
 * @param nodes - The graph.
 * @param type - A type the node carries.
 * @returns The node, or `undefined`.
 */
function nodeOfType(nodes: JsonLdNode[], type: string) {
	return nodes.find((node) => [node['@type']].flat().includes(type));
}

// SECURITY: `JsonLd` (src/components/utility/JsonLd.tsx) renders this through
// `dangerouslySetInnerHTML`, with CMS copy inside. Without the escape, a
// `</script>` in a page title ends the tag and runs whatever follows it.
describe('serializeJsonLd', () => {
	test('cannot be closed by CMS copy, and still parses back', () => {
		const graph = buildPageJsonLd({
			...BASE,
			path: '/about',
			name: '</script><script>alert(1)</script>',
		});
		const json = serializeJsonLd(graph);

		expect(json).not.toContain('<');
		expect(JSON.parse(json)).toEqual(graph);
	});
});

describe('buildPageJsonLd', () => {
	test('below the home page: a web page with a two-step breadcrumb', () => {
		const { '@graph': nodes } = buildPageJsonLd({
			...BASE,
			path: '/about',
			name: 'About',
		});

		expect(nodeOfType(nodes, 'WebPage')?.url).toBe(`${SITE}/about`);
		expect(nodeOfType(nodes, 'BreadcrumbList')?.itemListElement).toEqual([
			{ '@type': 'ListItem', position: 1, name: 'Acme', item: SITE },
			{
				'@type': 'ListItem',
				position: 2,
				name: 'About',
				item: `${SITE}/about`,
			},
		]);
	});

	test('the home page has no breadcrumb and ids under the origin', () => {
		const { '@graph': nodes } = buildPageJsonLd({
			...BASE,
			path: '/',
			name: 'Acme',
		});

		expect(nodes).toHaveLength(1);
		expect(nodes[0]?.['@id']).toBe(`${SITE}/#webpage`);
		expect(nodes[0]?.url).toBe(SITE);
	});

	test('answered questions make an FAQ page; incomplete ones are dropped', () => {
		const build = (faqs: { question: string | null; answer: string }[]) =>
			buildPageJsonLd({
				...BASE,
				path: '/pricing',
				name: 'Pricing',
				type: 'AboutPage',
				faqs,
			})['@graph'][0];

		const page = build([
			{ question: ' Do you ship abroad? ', answer: 'Yes.' },
			{ question: 'Unanswered?', answer: '  ' },
			{ question: null, answer: 'An answer to nothing.' },
		]);
		expect(page?.['@type']).toEqual(['AboutPage', 'FAQPage']);
		expect(page?.mainEntity).toEqual([
			{
				'@type': 'Question',
				name: 'Do you ship abroad?',
				acceptedAnswer: { '@type': 'Answer', text: 'Yes.' },
			},
		]);

		// No complete question: the editor's type alone, and no FAQ entities.
		const plain = build([{ question: 'Unanswered?', answer: '' }]);
		expect(plain?.['@type']).toBe('AboutPage');
		expect(plain?.mainEntity).toBeUndefined();
	});
});

describe('buildPostJsonLd', () => {
	test('a post sits under its listing in the breadcrumb', () => {
		const { '@graph': nodes } = buildPostJsonLd({
			siteUrl: SITE,
			path: '/posts/hello',
			headline: 'Hello',
			language: 'en-US',
			siteName: 'Acme',
			index: { name: 'Blog', path: '/posts' },
		});

		expect(nodeOfType(nodes, 'BlogPosting')?.url).toBe(`${SITE}/posts/hello`);
		expect(nodeOfType(nodes, 'BreadcrumbList')?.itemListElement).toEqual([
			{ '@type': 'ListItem', position: 1, name: 'Acme', item: SITE },
			{ '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/posts` },
			{
				'@type': 'ListItem',
				position: 3,
				name: 'Hello',
				item: `${SITE}/posts/hello`,
			},
		]);
	});
});

describe('toAbsoluteUrl', () => {
	test('spells the home page as the bare origin, like the canonical tag', () => {
		expect(toAbsoluteUrl(SITE, '/')).toBe(SITE);
		expect(toAbsoluteUrl(SITE, '/about')).toBe(`${SITE}/about`);
	});
});
