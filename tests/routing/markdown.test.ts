import { describe, expect, test } from 'bun:test';
import { indexGroups } from '@/lib/markdown/indexFiles';
import {
	htmlPathToMarkdownPath,
	markdownPathToHtmlPath,
} from '@/lib/markdown/paths';

// ROUTING: these two functions are the whole contract between a document and
// its markdown. The `.md` route handler reads a document through
// `markdownPathToHtmlPath`; the `<link rel="alternate">` on every page and
// post, the llms.txt and sitemap.md entries and `generateStaticParams` all
// build URLs with `htmlPathToMarkdownPath`. If the two drift apart, every
// advertised `.md` URL 404s and nothing looks wrong in a browser.
describe('markdown paths', () => {
	test('maps a page or post to its markdown path and back', () => {
		for (const [html, markdown] of [
			['/', '/index.md'],
			['/about', '/about.md'],
			['/company/team', '/company/team.md'],
			['/posts/hello-world', '/posts/hello-world.md'],
		]) {
			expect(htmlPathToMarkdownPath(html)).toBe(markdown);
			expect(markdownPathToHtmlPath(markdown)).toBe(html);
		}
	});

	test('rejects paths that name no markdown', () => {
		expect(markdownPathToHtmlPath('/about')).toBeUndefined();
		expect(markdownPathToHtmlPath('/about.mdx')).toBeUndefined();
		expect(markdownPathToHtmlPath('/.md')).toBeUndefined();
		expect(markdownPathToHtmlPath('/a/.md')).toBeUndefined();
		expect(markdownPathToHtmlPath('about.md')).toBeUndefined();
	});
});

// `geo.llmsListing` decides what agents are pointed at, and a wrong answer
// is silent: a page vanishes from /llms.txt, or one the editor hid shows up.
describe('llms.txt listing', () => {
	const summary = { title: 'T', metaTitle: null, metaDescription: null };

	test('groups documents by their listing, defaulting to listed', () => {
		const groups = indexGroups(
			[
				{ ...summary, route: '/', llmsSummary: null, llmsListing: null },
				{
					...summary,
					route: '/faq',
					llmsSummary: null,
					llmsListing: 'optional',
				},
				{
					...summary,
					route: '/old',
					llmsSummary: null,
					llmsListing: 'unlisted',
				},
			],
			[
				{
					...summary,
					slug: 'hi',
					llmsSummary: 'Says hi.',
					llmsListing: 'listed',
				},
			],
			{ siteUrl: 'https://example.com' },
		);
		const urls = Object.fromEntries(
			groups.map((group) => [group.title, group.entries.map((e) => e.url)]),
		);

		expect(urls).toEqual({
			Pages: ['https://example.com/index.md'],
			Posts: ['https://example.com/posts/hi.md'],
			Optional: ['https://example.com/faq.md'],
		});
		expect(groups[1]?.entries[0]?.description).toBe('Says hi.');
	});
});
