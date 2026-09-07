import { describe, expect, test } from 'bun:test';
import { cn } from '@/lib/utils';

describe('cn', () => {
	test('joins class names', () => {
		expect(cn('a', 'b')).toBe('a b');
	});

	test('drops falsy values', () => {
		expect(cn('a', false, undefined, null, 'b')).toBe('a b');
	});

	test('applies conditional object syntax', () => {
		expect(cn('a', { b: true, c: false })).toBe('a b');
	});

	test('lets a later Tailwind utility win over an earlier conflicting one', () => {
		expect(cn('p-2', 'p-4')).toBe('p-4');
		expect(cn('text-muted text-sm', 'text-foreground')).toBe(
			'text-sm text-foreground',
		);
	});

	test('keeps non-conflicting utilities', () => {
		expect(cn('mt-2', 'mb-4')).toBe('mt-2 mb-4');
	});
});
