import { PortableText, type PortableTextComponents } from '@portabletext/react';
import SmartImage from '@/components/utility/SmartImage';
import { getTarget } from '@/lib/url';
import type { SmartImageObject } from '@/types';

/**
 * Portable Text renderer configuration.
 *
 * Block-level typography lives in the `.prose-content` class rather than here,
 * so this stays a mapping from Portable Text types to elements. Only the cases
 * that genuinely need a component — images and links — are overridden.
 */
const components: PortableTextComponents = {
	types: {
		contentImage: ({
			value,
		}: {
			value: SmartImageObject & { alt?: string };
		}) => {
			if (!value?.asset) return null;

			return (
				<figure>
					<SmartImage
						image={value}
						sizes='(min-width: 768px) 720px, 100vw'
						className='h-auto w-full rounded-theme'
					/>
					{value.caption && <figcaption>{value.caption}</figcaption>}
				</figure>
			);
		},
	},
	marks: {
		link: ({ value, children }) => {
			const href: string = value?.href ?? '';
			const target = getTarget(href);

			return (
				<a
					href={href}
					target={target}
					rel={target === '_blank' ? 'noopener noreferrer' : undefined}
				>
					{children}
				</a>
			);
		},
	},
};

/**
 * Renders a post body from Portable Text.
 *
 * @param props.value - The `content` array from `POST_QUERY`.
 * @returns The rendered body, or `null` when there is no content.
 */
export default function PostBody({ value }: { value: unknown }) {
	if (!Array.isArray(value) || value.length === 0) {
		return null;
	}

	return (
		<div className='prose-content'>
			{/* biome-ignore lint/suspicious/noExplicitAny: Portable Text blocks are
			    structurally typed by TypeGen per-field; the renderer accepts the
			    generic block array shape. */}
			<PortableText value={value as any} components={components} />
		</div>
	);
}
