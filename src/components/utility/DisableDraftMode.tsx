'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useIsMainWindow } from '@/hooks';
import { disableDraftMode } from '@/lib/actions';

/**
 * Floating control that leaves draft mode.
 *
 * Hidden inside an iframe, so it does not appear over the Presentation tool's
 * own preview — only in a tab the editor opened directly.
 *
 * @returns The button, or `null` when rendered in an embedded window.
 */
export default function DisableDraftMode() {
	const router = useRouter();
	const [pending, startTransition] = useTransition();
	const isMainWindow = useIsMainWindow();

	if (!isMainWindow) {
		return null;
	}

	const disable = () =>
		startTransition(async () => {
			await disableDraftMode();
			router.refresh();
		});

	return (
		// z-index lives on the positioned ancestor: a z-index on the button alone
		// is trapped inside this fixed element's stacking context.
		<div className='fixed right-6 bottom-6 z-[9999]'>
			<button
				type='button'
				// #C7291C reaches 5.9:1 against white; the brand red it replaced was
				// 3.71:1, which fails WCAG 1.4.3 at this text size.
				className='flex items-center gap-2 text-nowrap rounded-theme bg-[#C7291C] px-3 py-2 font-medium font-mono text-white text-xs uppercase shadow-lg transition-colors disabled:bg-[#8A1D14]'
				disabled={pending}
				onClick={disable}
			>
				<svg
					width='14'
					height='14'
					viewBox='0 0 24 24'
					fill='currentColor'
					aria-hidden='true'
				>
					<title>Sanity</title>
					<path d='M4.7 3.9C3.2 5 2.4 6.6 2.4 8.5c0 3.3 2 5.2 6.1 6.3l3 .7c1.6.4 2.4 1.1 2.4 2.1 0 1.3-1.3 2.2-3.3 2.2-2.4 0-3.9-1.2-4.2-3.4H2.3c.2 3.9 3.2 6.4 7.9 6.4 4.4 0 7.3-2.3 7.3-5.9 0-2.9-1.6-4.6-5.4-5.6l-3.1-.8c-1.9-.5-2.8-1.2-2.8-2.3 0-1.3 1.2-2.2 3.1-2.2 2 0 3.4 1 3.7 2.9h4c-.2-3.6-3-6-7.6-6-2 0-3.7.4-4.9 1.3M15.1 15l4 1.3c-.7 2.9-3 4.9-6.3 5.4v-3.5c1.2-.4 2-1.3 2.3-3.2M9.1 8.9l-4-1.3C5.7 4.9 7.9 3 11.1 2.6v3.6c-1.1.3-1.8 1.1-2 2.7' />
				</svg>
				{pending ? 'Disabling edit mode' : 'Disable edit mode'}
			</button>
		</div>
	);
}
