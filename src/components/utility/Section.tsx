import { stegaClean } from 'next-sanity';
import { PADDING_CONFIG } from '@/config';
import { cn } from '@/lib/utils';
import type { BaseSectionProps, PaddingSize } from '@/types';

export const PADDING_CLASSES: Record<
	'top' | 'bottom',
	Record<PaddingSize, string>
> = {
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

export default function Section({
	children,
	className,
	...props
}: BaseSectionProps & { children: React.ReactNode; className?: string }) {
	if (props.hidden) {
		return null;
	}

	const { _type, padding, id } = stegaClean(props);

	const topPadding = (padding?.top || 'none') as PaddingSize;
	const bottomPadding = (padding?.bottom || 'none') as PaddingSize;

	return (
		<section
			section-type={_type}
			id={id}
			className={cn(
				PADDING_CLASSES.top[topPadding],
				PADDING_CLASSES.bottom[bottomPadding],
				className,
			)}
		>
			{children}
		</section>
	);
}
