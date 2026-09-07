import { describe, expect, test } from 'bun:test';
import { buildOptimizedImageUrl } from '@/lib/image';

const BASE = 'https://cdn.sanity.io/images/abc/production/img-1200x800.jpg';

describe('buildOptimizedImageUrl', () => {
	test('adds width, height and quality', () => {
		const url = new URL(
			buildOptimizedImageUrl(BASE, { width: 640, height: 480, quality: 90 }),
		);
		expect(url.searchParams.get('w')).toBe('640');
		expect(url.searchParams.get('h')).toBe('480');
		expect(url.searchParams.get('q')).toBe('90');
	});

	test('defaults quality to 75', () => {
		const url = new URL(buildOptimizedImageUrl(BASE, {}));
		expect(url.searchParams.get('q')).toBe('75');
	});

	test('omits dimensions that were not requested', () => {
		const url = new URL(buildOptimizedImageUrl(BASE, { width: 640 }));
		expect(url.searchParams.get('w')).toBe('640');
		expect(url.searchParams.has('h')).toBe(false);
	});

	test('preserves the origin and path', () => {
		const url = new URL(buildOptimizedImageUrl(BASE, { width: 100 }));
		expect(url.origin).toBe('https://cdn.sanity.io');
		expect(url.pathname).toBe('/images/abc/production/img-1200x800.jpg');
	});

	test('overwrites rather than appends an existing parameter', () => {
		const url = new URL(buildOptimizedImageUrl(`${BASE}?w=50`, { width: 640 }));
		expect(url.searchParams.getAll('w')).toEqual(['640']);
	});
});
