import { describe, expect, test } from 'bun:test';
import { formatPostDate } from '@/lib/date';

describe('formatPostDate', () => {
	test('formats an ISO timestamp', () => {
		expect(formatPostDate('2026-03-14T10:30:00Z')).toBe('March 14, 2026');
	});

	test('formats in UTC regardless of the host timezone', () => {
		// Without a pinned timeZone this rolls back to the 13th west of UTC.
		expect(formatPostDate('2026-03-14T02:00:00Z')).toBe('March 14, 2026');
	});

	test('returns an empty string for missing values', () => {
		expect(formatPostDate(null)).toBe('');
		expect(formatPostDate(undefined)).toBe('');
		expect(formatPostDate('')).toBe('');
	});

	test('returns an empty string rather than "Invalid Date"', () => {
		expect(formatPostDate('not-a-date')).toBe('');
	});
});
