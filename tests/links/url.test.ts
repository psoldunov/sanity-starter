import { afterEach, describe, expect, test } from 'bun:test';
import { getSiteUrl, getTarget, isExternalUrl } from '@/lib/url';

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
	process.env = { ...ORIGINAL_ENV };
});

describe('isExternalUrl', () => {
	test('treats http and https as external', () => {
		expect(isExternalUrl('https://example.com')).toBe(true);
		expect(isExternalUrl('http://example.com')).toBe(true);
		expect(isExternalUrl('HTTPS://EXAMPLE.COM')).toBe(true);
	});

	test('treats protocol-relative URLs as external', () => {
		// The bug this guards: a naive startsWith('/') check calls this internal.
		expect(isExternalUrl('//evil.com')).toBe(true);
	});

	test('sees through leading whitespace', () => {
		// Security guard. Browsers strip leading whitespace from an href, so
		// these navigate cross-origin. An untrimmed check calls them internal,
		// and SmartLink then drops target='_blank' and rel='noopener'.
		expect(isExternalUrl('  https://evil.com')).toBe(true);
		expect(isExternalUrl('\t//evil.com')).toBe(true);
		expect(isExternalUrl('\n http://evil.com')).toBe(true);
	});

	test('treats same-site paths as internal', () => {
		expect(isExternalUrl('/about')).toBe(false);
		expect(isExternalUrl('/posts/hello')).toBe(false);
	});

	test('does not mistake a path beginning with "http" for a URL', () => {
		// The bug this guards: startsWith('http') matched this path.
		expect(isExternalUrl('/http-headers-explained')).toBe(false);
	});

	test('treats mailto and tel as internal so they open in place', () => {
		expect(isExternalUrl('mailto:hi@example.com')).toBe(false);
		expect(isExternalUrl('tel:+15551234567')).toBe(false);
	});

	test('handles empty input', () => {
		expect(isExternalUrl(undefined)).toBe(false);
		expect(isExternalUrl('')).toBe(false);
	});
});

describe('getTarget', () => {
	test('opens external links in a new tab', () => {
		expect(getTarget('https://example.com')).toBe('_blank');
	});

	test('leaves internal links in place', () => {
		expect(getTarget('/about')).toBeUndefined();
		expect(getTarget('mailto:hi@example.com')).toBeUndefined();
		expect(getTarget(undefined)).toBeUndefined();
	});
});

describe('getSiteUrl', () => {
	test('prefers an explicit site URL and strips a trailing slash', () => {
		process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com/';
		expect(getSiteUrl()).toBe('https://example.com');
	});

	test('uses the production URL on Vercel production', () => {
		process.env.NEXT_PUBLIC_SITE_URL = '';
		process.env.VERCEL_ENV = 'production';
		process.env.VERCEL_PROJECT_PRODUCTION_URL = 'example.com';
		expect(getSiteUrl()).toBe('https://example.com');
	});

	test('falls back to the deployment URL on a preview', () => {
		process.env.NEXT_PUBLIC_SITE_URL = '';
		process.env.VERCEL_ENV = 'preview';
		process.env.VERCEL_URL = 'preview-abc.vercel.app';
		expect(getSiteUrl()).toBe('https://preview-abc.vercel.app');
	});

	test('falls back to localhost with the configured port', () => {
		process.env.NEXT_PUBLIC_SITE_URL = '';
		process.env.VERCEL_ENV = '';
		process.env.VERCEL_URL = '';
		process.env.PORT = '4000';
		expect(getSiteUrl()).toBe('http://localhost:4000');
	});
});
