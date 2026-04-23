import type { DefineLinkOptions } from '@/types';

/**
 * Returns an array member / field `type` reference for the shared `link`
 * (or `linkWithLabel`) registered schema type. TypeGen emits `Link` and
 * `LinkWithLabel` for these, so consumers can derive types without coupling
 * to any specific query.
 *
 * @param options - Configuration options
 * @param options.withLabel - Use the `linkWithLabel` variant with a label field (default: false)
 * @returns An object `{ type }` suitable for `array.of[]` or `defineField` spreads
 */
export default function defineLink(options: DefineLinkOptions = {}) {
	const { withLabel = false } = options;

	return {
		type: withLabel ? 'linkWithLabel' : 'link',
	} as const;
}
