import { describe, expect, test } from 'bun:test';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PAGE_QUERY } from '@/sanity/lib/queries';

/**
 * Every section folder's `fragment.ts` must reach `PAGE_QUERY`. `bun run
 * sections:gen` joins them into `SECTION_FRAGMENTS`, which `PAGE_QUERY`
 * interpolates. Break either half (a folder added without a regenerate, or the
 * `${SECTION_FRAGMENTS}` interpolation dropped) and nothing fails: the section
 * type-checks, the page builds, and the section falls through to the bare
 * `sections[] { ... }` projection, reaching its component with images as
 * unresolved references and links as bare `_ref`s. It renders blank on the live
 * site with no error anywhere.
 *
 * The test reads the folders directly rather than the generated registry, so a
 * stale registry fails here too. It needs no edit when a section is added.
 */
const SECTION_NAMES = readdirSync(
	join(import.meta.dir, '..', '..', 'src', 'sections'),
	{ withFileTypes: true },
)
	.filter((entry) => entry.isDirectory())
	.map((entry) => entry.name);

const SECTION_FRAGMENTS: [string, unknown][] = await Promise.all(
	SECTION_NAMES.map(
		async (name): Promise<[string, unknown]> => [
			name,
			(await import(`@/sections/${name}/fragment`)).fragment,
		],
	),
);

describe('PAGE_QUERY', () => {
	test('interpolates every section folder fragment', () => {
		// Guards the scan too: a moved folder would otherwise leave this
		// passing on an empty list.
		expect(SECTION_FRAGMENTS.length).toBeGreaterThan(0);

		const missing = SECTION_FRAGMENTS.filter(
			// A non-string export fails here too. TypeGen resolves `${CONST}`
			// only when the referent is a plain template literal, so a fragment
			// turned into a function silently stops being projected.
			([, fragment]) =>
				typeof fragment !== 'string' || !PAGE_QUERY.includes(fragment),
		).map(([name]) => name);

		expect(missing).toEqual([]);
	});

	test("guards each fragment on its own folder's `_type`", () => {
		// A fragment copied from a sibling and left with the sibling's `_type`
		// is interpolated, passes the check above, and still never matches: the
		// section it was written for renders unresolved, and the section it
		// names gets projected twice.
		const mismatched = SECTION_FRAGMENTS.filter(([name, fragment]) => {
			if (typeof fragment !== 'string') return true;
			// Tolerant of GROQ's accepted spellings (either quote style, any
			// whitespace around the operators), so a correctly wired fragment
			// cannot fail here on formatting alone.
			const guard = new RegExp(`_type\\s*==\\s*["']${name}["']\\s*=>`);
			return !guard.test(fragment);
		}).map(([name]) => name);

		expect(mismatched).toEqual([]);
	});
});
