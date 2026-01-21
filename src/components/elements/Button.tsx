import type React from 'react';
import { cn } from '@/lib/utils';
import { Slot } from '../utility/Slot';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	asChild?: boolean;
}

export default function Button({ className, asChild, ...props }: ButtonProps) {
	const Component = asChild ? Slot : 'button';

	return (
		<Component
			{...props}
			className={cn(
				'rounded-md border border-foreground px-2 py-1 text-foreground',
				className,
			)}
		/>
	);
}
