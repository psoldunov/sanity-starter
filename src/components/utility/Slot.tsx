import {
	Children,
	cloneElement,
	isValidElement,
	type ReactElement,
	type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

export interface SlotProps {
	children?: ReactNode;
	className?: string;
	[key: string]: unknown;
}

/**
 * Slot component that merges props and className with its child element.
 * Props passed to Slot will override the child's props.
 *
 * @param props - Props to merge with child, including className
 * @param props.children - Single React element to merge props with
 * @returns Cloned child element with merged props and className
 */
export function Slot({ children, className, ...props }: SlotProps) {
	if (!children) {
		console.error('Slot component requires a child element.');
		return null;
	}

	const child = Children.only(children);

	if (!isValidElement(child)) {
		console.error(
			'Slot component expects a single valid React element as a child.',
		);
		return null;
	}

	const childProps = (child.props as Record<string, unknown>) || {};

	return cloneElement(child as ReactElement<Record<string, unknown>>, {
		...childProps,
		...props,
		className: cn(
			typeof childProps.className === 'string'
				? childProps.className
				: undefined,
			className,
		),
	});
}
