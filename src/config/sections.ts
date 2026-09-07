/**
 * Section types that read `searchParams`.
 *
 * A page containing one of these cannot be fully static, so `hasDynamicParams`
 * uses this list to decide whether to await `searchParams` at all.
 *
 * It lives in config rather than in `src/lib/sections.ts` on purpose: that
 * module imports every section *component*, so reading this list from there
 * would pull React and the whole component graph into `src/lib/slug.ts` — and
 * into anything that tests it.
 */
export const DYNAMIC_SECTION_TYPES: readonly string[] = [];
