import clsx, { type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * `twMerge`, taught the custom theme tokens defined in
 * `src/styles/globals.css`.
 *
 * tailwind-merge only knows Tailwind's built-in scales. A token added to a
 * theme namespace it does not know about produces a class it cannot place in a
 * conflict group, so the override silently fails and BOTH classes survive:
 * `cn('rounded-lg', 'rounded-theme')` returned `'rounded-lg rounded-theme'`
 * before this, and which one won was down to CSS source order.
 *
 * Colours are the exception — an unrecognised `bg-*` / `text-*` value falls
 * back to the colour group on its own, so `--color-*` tokens need no entry.
 *
 * **Every non-colour token added to `@theme` needs a line here, in the same
 * commit.** The tailwind-merge key matches the CSS namespace: `--radius-*` →
 * `radius`, `--text-*` → `text`, `--leading-*` → `leading`, `--spacing-*` →
 * `spacing`, `--shadow-*` → `shadow`, `--ease-*` → `ease`, `--animate-*` →
 * `animate`, and so on.
 */
const twMerge = extendTailwindMerge({
	extend: {
		theme: {
			radius: ['theme'],
		},
	},
});

/**
 * Combines class names using clsx and tailwind-merge
 * @param inputs - Class values to combine
 * @returns Merged class names string
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
