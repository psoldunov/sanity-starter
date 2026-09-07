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

const EVENT_HANDLER_PATTERN = /^on[A-Z]/;

/**
 * Composes two event handlers of the same name into one, so a handler supplied
 * by the Slot does not silently replace one already on the child.
 *
 * @param slotHandler - Handler passed to the Slot.
 * @param childHandler - Handler already present on the child element.
 * @returns A handler that calls both, slot first.
 */
function composeHandlers(
	slotHandler: (...args: unknown[]) => void,
	childHandler: (...args: unknown[]) => void,
) {
	return (...args: unknown[]) => {
		slotHandler(...args);
		childHandler(...args);
	};
}

/**
 * Merges props onto a single child element instead of rendering a wrapper.
 *
 * Slot props win over the child's, except for `className`, which is merged, and
 * event handlers, which are composed — a plain override would drop the child's
 * own `onClick` without a trace.
 *
 * @param props - Props to merge onto the child, including `className`.
 * @param props.children - Exactly one React element.
 * @returns The cloned child, or `null` when the child is not a single element.
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
	const mergedProps: Record<string, unknown> = { ...childProps, ...props };

	for (const [key, slotValue] of Object.entries(props)) {
		const childValue = childProps[key];
		if (
			EVENT_HANDLER_PATTERN.test(key) &&
			typeof slotValue === 'function' &&
			typeof childValue === 'function'
		) {
			mergedProps[key] = composeHandlers(
				slotValue as (...args: unknown[]) => void,
				childValue as (...args: unknown[]) => void,
			);
		}
	}

	return cloneElement(child as ReactElement<Record<string, unknown>>, {
		...mergedProps,
		className: cn(
			typeof childProps.className === 'string'
				? childProps.className
				: undefined,
			className,
		),
	});
}
