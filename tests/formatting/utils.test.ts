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

	// Guards the `extendTailwindMerge` theme list in `src/lib/utils.ts`. Plain
	// `twMerge` does not know `--radius-theme`, cannot group `rounded-theme`
	// with the built-in radii, and returns both classes — a silent override
	// failure whose winner is decided by CSS source order. Add a case here for
	// every non-colour token added to `@theme`.
	test('merges custom theme tokens against their built-in siblings', () => {
		expect(cn('rounded-lg', 'rounded-theme')).toBe('rounded-theme');
		expect(cn('rounded-theme', 'rounded-none')).toBe('rounded-none');
	});

	// Colours need no entry: tailwind-merge falls back to the colour group for
	// an unrecognised `bg-*` / `text-*` value. Pinned so a future `override:`
	// (rather than `extend:`) cannot take that fallback away unnoticed.
	test('merges custom colour tokens without an explicit entry', () => {
		expect(cn('bg-white', 'bg-surface')).toBe('bg-surface');
		expect(cn('text-foreground', 'text-accent')).toBe('text-accent');
		expect(cn('border-border', 'border-accent')).toBe('border-accent');
		// The one that would break first if a custom `--text-*` size token were
		// added to `@theme` without a matching `text:` entry: twMerge would then
		// have to guess between font-size and colour.
		expect(cn('text-sm', 'text-muted')).toBe('text-sm text-muted');
	});
});
