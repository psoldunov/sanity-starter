import { describe, expect, test } from 'bun:test';
import * as fragments from '@/sanity/lib/fragments';
import { PAGE_QUERY } from '@/sanity/lib/queries';

/**
 * Registering a section means writing its fragment in one file and
 * interpolating it into `PAGE_QUERY` in another (AGENTS.md → Section-Based
 * Architecture, step 5). Skip the second half and nothing fails: the section
 * type-checks, the page builds, and the section falls through to the bare
 * `sections[] { ... }` projection — reaching the component with its images as
 * unresolved references and its links as bare `_ref`s. The section renders
 * blank on the live site with no error anywhere.
 *
 * This is the one wiring mistake in the 7-step pattern that neither the
 * compiler nor TypeGen can catch, and it costs nothing to keep current: the
 * check is per-fragment and needs no edit when a section is added.
 */
const SECTION_FRAGMENTS = Object.entries(fragments).filter(([name]) =>
	name.endsWith('_SECTION_FRAGMENT'),
);

describe('PAGE_QUERY', () => {
	test('interpolates every section fragment', () => {
		// Guards the filter too: renaming the suffix convention would otherwise
		// leave this passing on an empty list.
		expect(SECTION_FRAGMENTS.length).toBeGreaterThan(0);

		const missing = SECTION_FRAGMENTS.filter(
			// A non-string export fails here too. AGENTS.md requires a plain
			// template literal: TypeGen resolves `${CONST}` only when the
			// referent is one, so a fragment turned into a function silently
			// stops being projected.
			([, fragment]) =>
				typeof fragment !== 'string' || !PAGE_QUERY.includes(fragment),
		).map(([name]) => name);

		expect(missing).toEqual([]);
	});

	test('guards each section fragment on its own `_type`', () => {
		// A fragment copied from a sibling and left with the sibling's `_type`
		// is interpolated, passes the check above, and still never matches —
		// the section it was written for renders unresolved, and the section it
		// names gets projected twice.
		const mismatched = SECTION_FRAGMENTS.filter(([name, fragment]) => {
			if (typeof fragment !== 'string') return true;
			// `HERO_SECTION_FRAGMENT` -> `heroSection`
			const type = name
				.replace(/_FRAGMENT$/, '')
				.toLowerCase()
				.replace(/_(.)/g, (_, character: string) => character.toUpperCase());
			// Tolerant of GROQ's accepted spellings — either quote style, and
			// any whitespace around the operators — so a correctly wired
			// fragment cannot fail here on formatting alone.
			const guard = new RegExp(`_type\\s*==\\s*["']${type}["']\\s*=>`);
			return !guard.test(fragment);
		}).map(([name]) => name);

		expect(mismatched).toEqual([]);
	});
});
