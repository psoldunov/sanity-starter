import { describe, expect, test } from 'bun:test';
import { hasDynamicParams, normalizeSlug, splitSlug } from '@/lib/slug';

describe('normalizeSlug', () => {
	test('maps an absent slug to the site root', () => {
		expect(normalizeSlug(undefined)).toBe('/');
	});

	test('maps an empty catch-all array to the site root', () => {
		// Next hands `[]` for the index route under some configurations.
		expect(normalizeSlug([])).toBe('/');
	});

	test('joins catch-all segments', () => {
		expect(normalizeSlug(['about'])).toBe('/about');
		expect(normalizeSlug(['company', 'team'])).toBe('/company/team');
	});

	test('adds a leading slash to a bare string', () => {
		expect(normalizeSlug('about')).toBe('/about');
	});

	test('leaves an already-absolute string alone', () => {
		expect(normalizeSlug('/about')).toBe('/about');
	});
});

describe('splitSlug', () => {
	test('splits a route into segments', () => {
		expect(splitSlug('/company/team')).toEqual(['company', 'team']);
	});

	test('drops empty segments from leading, trailing and doubled slashes', () => {
		expect(splitSlug('/about/')).toEqual(['about']);
		expect(splitSlug('//about//team//')).toEqual(['about', 'team']);
	});

	test('returns an empty array for the root', () => {
		expect(splitSlug('/')).toEqual([]);
	});
});

describe('hasDynamicParams', () => {
	test('is false when the page has no sections', () => {
		expect(hasDynamicParams({})).toBe(false);
		expect(hasDynamicParams({ sections: null })).toBe(false);
		expect(hasDynamicParams({ sections: [] })).toBe(false);
	});

	test('is false when no section type is registered as dynamic', () => {
		// DYNAMIC_SECTION_TYPES ships empty, so nothing opts a page into
		// awaiting searchParams until an adopter registers a type.
		expect(hasDynamicParams({ sections: [{ _type: 'heroSection' }] })).toBe(
			false,
		);
	});
});
