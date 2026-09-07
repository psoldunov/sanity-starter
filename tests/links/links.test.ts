import { describe, expect, test } from 'bun:test';
import {
	hasDestination,
	isSafeInternalPath,
	resolveDestinationUrl,
	resolveLinkHref,
	resolveLinkRel,
} from '@/lib/links';
import type { ResolvedDestination } from '@/types';

/**
 * Builds a destination in the shape `INTERNAL_DESTINATION_PROJECTION` returns.
 *
 * @param destination - Partial destination fields to include.
 * @returns A destination object cast to the projected type.
 */
function destination(
	destination: Record<string, unknown>,
): ResolvedDestination {
	return destination as unknown as ResolvedDestination;
}

describe('isSafeInternalPath', () => {
	test('accepts same-origin absolute paths', () => {
		expect(isSafeInternalPath('/')).toBe(true);
		expect(isSafeInternalPath('/about')).toBe(true);
		expect(isSafeInternalPath('/posts/hello-world')).toBe(true);
	});

	test('rejects protocol-relative paths', () => {
		// These are the open-redirect vectors: both start with '/'.
		expect(isSafeInternalPath('//evil.com')).toBe(false);
		expect(isSafeInternalPath('//evil.com/path')).toBe(false);
	});

	test('rejects backslash-escaped protocol-relative paths', () => {
		expect(isSafeInternalPath('/\\evil.com')).toBe(false);
	});

	test('rejects absolute URLs and relative paths', () => {
		expect(isSafeInternalPath('https://evil.com')).toBe(false);
		expect(isSafeInternalPath('about')).toBe(false);
		expect(isSafeInternalPath('')).toBe(false);
	});
});

describe('hasDestination', () => {
	test('is true for a document reference', () => {
		expect(hasDestination({ reference: { _ref: 'abc123' } })).toBe(true);
	});

	test('is true for a static path', () => {
		expect(hasDestination({ staticPath: '/contact' })).toBe(true);
	});

	test('is false when empty or partially filled', () => {
		expect(hasDestination(undefined)).toBe(false);
		expect(hasDestination({})).toBe(false);
		expect(hasDestination({ reference: {} })).toBe(false);
		expect(hasDestination({ staticPath: '' })).toBe(false);
	});
});

describe('resolveDestinationUrl', () => {
	test('resolves a static path', () => {
		expect(resolveDestinationUrl(destination({ staticPath: '/contact' }))).toBe(
			'/contact',
		);
	});

	test('refuses a static path that would leave the origin', () => {
		expect(
			resolveDestinationUrl(destination({ staticPath: '//evil.com' })),
		).toBeUndefined();
		expect(
			resolveDestinationUrl(destination({ staticPath: 'https://evil.com' })),
		).toBeUndefined();
	});

	test('resolves a page reference to its route', () => {
		const result = resolveDestinationUrl(
			destination({ reference: { _type: 'page', route: '/about' } }),
		);
		expect(result).toBe('/about');
	});

	test('refuses a page route that would leave the origin', () => {
		// Open-redirect guard. A page route feeds `redirect()` in
		// src/app/(site)/[[...slug]]/page.tsx, so an off-origin route stored on
		// a page document — Studio validation is not enforced on API writes —
		// must not resolve. Do not relax this without reading that call site.
		expect(
			resolveDestinationUrl(
				destination({ reference: { _type: 'page', route: '//evil.com' } }),
			),
		).toBeUndefined();
		expect(
			resolveDestinationUrl(
				destination({ reference: { _type: 'page', route: '/\\evil.com' } }),
			),
		).toBeUndefined();
		expect(
			resolveDestinationUrl(
				destination({
					reference: { _type: 'page', route: 'https://evil.com' },
				}),
			),
		).toBeUndefined();
	});

	test('refuses an unsafe page route even with a section anchor', () => {
		// The anchor must not be a way to smuggle a rejected route through.
		expect(
			resolveDestinationUrl(
				destination({ reference: { _type: 'page', route: '//evil.com' } }),
				'team',
			),
		).toBeUndefined();
	});

	test('appends a section anchor to a page route', () => {
		const result = resolveDestinationUrl(
			destination({ reference: { _type: 'page', route: '/about' } }),
			'team',
		);
		expect(result).toBe('/about#team');
	});

	test('resolves a linkable document to its base path plus slug', () => {
		const result = resolveDestinationUrl(
			destination({ reference: { _type: 'post', slug: 'hello-world' } }),
		);
		expect(result).toBe('/posts/hello-world');
	});

	test('refuses a document slug that would climb out of its base path', () => {
		// Open-redirect / route-confusion guard. A Sanity slug is one path
		// segment; a stored slash lets `basePath + slug` resolve somewhere else
		// entirely. Studio validation is advisory and not enforced on API writes.
		expect(
			resolveDestinationUrl(
				destination({ reference: { _type: 'post', slug: '../../evil' } }),
			),
		).toBeUndefined();
		expect(
			resolveDestinationUrl(
				destination({ reference: { _type: 'post', slug: '/evil.com' } }),
			),
		).toBeUndefined();
	});

	test('ignores a section anchor on a non-page reference', () => {
		// Only pages carry section anchors; a post has none to link to.
		const result = resolveDestinationUrl(
			destination({ reference: { _type: 'post', slug: 'hello-world' } }),
			'team',
		);
		expect(result).toBe('/posts/hello-world');
	});

	test('returns undefined for an unregistered document type', () => {
		const result = resolveDestinationUrl(
			destination({ reference: { _type: 'author', slug: 'jane' } }),
		);
		expect(result).toBeUndefined();
	});

	test('returns undefined when there is nothing to resolve', () => {
		expect(resolveDestinationUrl(undefined)).toBeUndefined();
		expect(resolveDestinationUrl(destination({}))).toBeUndefined();
		expect(
			resolveDestinationUrl(destination({ reference: { _type: 'page' } })),
		).toBeUndefined();
	});
});

describe('resolveLinkHref', () => {
	test('a file download beats every other destination', () => {
		expect(
			resolveLinkHref(
				{
					href: 'https://example.com',
					page: destination({ staticPath: '/x' }),
				},
				'https://cdn.sanity.io/files/a/b/doc.pdf',
			),
		).toBe('https://cdn.sanity.io/files/a/b/doc.pdf');
	});

	test('an external URL beats an internal destination', () => {
		expect(
			resolveLinkHref(
				{
					href: 'https://example.com',
					page: destination({ staticPath: '/contact' }),
				},
				undefined,
			),
		).toBe('https://example.com');
	});

	test('falls back to the internal destination', () => {
		expect(
			resolveLinkHref(
				{ page: destination({ staticPath: '/contact' }) },
				undefined,
			),
		).toBe('/contact');
	});

	test('an unsafe internal destination resolves to nothing', () => {
		// The guard has to survive the extraction: SmartLink renders null rather
		// than an href when this returns undefined.
		expect(
			resolveLinkHref(
				{ page: destination({ staticPath: '//evil.com' }) },
				undefined,
			),
		).toBeUndefined();
	});

	test('an empty link resolves to nothing', () => {
		expect(resolveLinkHref({}, undefined)).toBeUndefined();
	});
});

describe('resolveLinkRel', () => {
	test('a new-tab link gets noopener noreferrer', () => {
		// Without it the opened page can reach back through window.opener.
		expect(
			resolveLinkRel({ target: '_blank', rel: undefined, linkRel: undefined }),
		).toBe('noopener noreferrer');
	});

	test('the CMS value wins over the default', () => {
		expect(
			resolveLinkRel({ target: '_blank', rel: undefined, linkRel: 'noopener' }),
		).toBe('noopener');
	});

	test('an explicit prop wins over everything', () => {
		expect(
			resolveLinkRel({
				target: '_blank',
				rel: 'nofollow',
				linkRel: 'noopener',
			}),
		).toBe('nofollow');
	});

	test('a same-tab link keeps a rel the editor set', () => {
		// The helper covers both branches SmartLink renders. Returning undefined
		// here would silently drop a `nofollow` an editor chose deliberately.
		expect(
			resolveLinkRel({
				target: undefined,
				rel: undefined,
				linkRel: 'nofollow',
			}),
		).toBe('nofollow');
		expect(
			resolveLinkRel({
				target: undefined,
				rel: 'sponsored',
				linkRel: 'nofollow',
			}),
		).toBe('sponsored');
	});

	test('a same-tab link with no rel anywhere gets none', () => {
		expect(
			resolveLinkRel({ target: undefined, rel: undefined, linkRel: undefined }),
		).toBeUndefined();
		expect(
			resolveLinkRel({ target: undefined, rel: undefined, linkRel: null }),
		).toBeUndefined();
	});
});
