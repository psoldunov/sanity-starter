import { draftMode } from 'next/headers';
import { stegaClean } from 'next-sanity';
import type { ReactNode } from 'react';
import { PADDING_CONFIG } from '@/config';
import { cn } from '@/lib/utils';
import type { PaddingSize, SectionBaseProps } from '@/types';

const PADDING_CLASSES: Record<'top' | 'bottom', Record<PaddingSize, string>> = {
	top: Object.fromEntries(
		Object.entries(PADDING_CONFIG).map(([size, config]) => [
			size,
			config.classes.top,
		]),
	) as Record<PaddingSize, string>,
	bottom: Object.fromEntries(
		Object.entries(PADDING_CONFIG).map(([size, config]) => [
			size,
			config.classes.bottom,
		]),
	) as Record<PaddingSize, string>,
};

/**
 * Wrapper every section renders through. Applies the configured padding, exposes
 * the section anchor id, and honours the `hidden` flag.
 *
 * A hidden section is omitted from the live site but rendered dimmed in draft
 * mode: an editor who hides a block still has to be able to see it in
 * Presentation to click it and unhide it again.
 *
 * @param props - Section base fields plus children and an optional className.
 * @returns The section element, or `null` when hidden outside draft mode.
 */
export default async function Section({
	children,
	className,
	...props
}: SectionBaseProps & { children: ReactNode; className?: string }) {
	const isDraft = (await draftMode()).isEnabled;

	if (props.hidden && !isDraft) {
		return null;
	}

	const { _type, padding, id } = stegaClean(props);

	const topPadding = (padding?.top || 'none') as PaddingSize;
	const bottomPadding = (padding?.bottom || 'none') as PaddingSize;

	return (
		<section
			data-section-type={_type}
			data-hidden={props.hidden || undefined}
			id={id ?? undefined}
			className={cn(
				PADDING_CLASSES.top[topPadding],
				PADDING_CLASSES.bottom[bottomPadding],
				props.hidden && 'opacity-40 outline-dashed outline-2 outline-amber-500',
				className,
			)}
		>
			{children}
		</section>
	);
}
