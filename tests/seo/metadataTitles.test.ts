import { expect, test } from 'bun:test';
import { stripSiteTitleSuffix } from '@/lib/metadataTitles';

test('removes repeated literal site suffixes and preserves other names', () => {
	expect(stripSiteTitleSuffix('About | A+B — a+b ', 'A+B')).toBe('About');
	expect(stripSiteTitleSuffix('About | AAAB', 'A+B')).toBe('About | AAAB');
	expect(stripSiteTitleSuffix('A+B', 'A+B')).toBeUndefined();
	expect(stripSiteTitleSuffix('A+B | A+B', 'A+B')).toBeUndefined();
});
