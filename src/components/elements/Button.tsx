import type { ButtonHTMLAttributes } from 'react';
import { Slot } from '@/components/utility/Slot';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
	primary:
		'bg-accent text-accent-foreground hover:opacity-90 border border-transparent',
	secondary:
		'border border-border bg-background text-foreground hover:bg-surface',
	ghost: 'border border-transparent text-foreground hover:bg-surface',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
	sm: 'h-8 px-3 text-sm',
	md: 'h-10 px-4 text-sm',
	lg: 'h-12 px-6 text-base',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	/** Renders the child element with the button's props merged in. */
	asChild?: boolean;
	variant?: ButtonVariant;
	size?: ButtonSize;
}

/**
 * Button with visual variants, a visible focus ring, and a disabled state.
 *
 * Pass `asChild` to project the styling onto a different element — a
 * `SmartLink`, for instance — so a link that looks like a button is still an
 * anchor and keeps its navigation semantics.
 *
 * @param props.asChild - Merge props onto the single child instead of a button.
 * @param props.variant - Visual style. Defaults to `primary`.
 * @param props.size - Control height and padding. Defaults to `md`.
 * @returns The button element, or the cloned child when `asChild` is set.
 */
export default function Button({
	className,
	asChild,
	variant = 'primary',
	size = 'md',
	...props
}: ButtonProps) {
	const Component = asChild ? Slot : 'button';

	return (
		<Component
			{...props}
			className={cn(
				'inline-flex items-center justify-center gap-2 rounded-theme font-medium transition-colors',
				'disabled:pointer-events-none disabled:opacity-50',
				VARIANT_CLASSES[variant],
				SIZE_CLASSES[size],
				className,
			)}
		/>
	);
}
