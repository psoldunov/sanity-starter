import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export default function Container({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn('mx-auto w-full max-w-5xl px-4', className)}>
			{children}
		</div>
	);
}
