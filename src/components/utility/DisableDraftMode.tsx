'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { SiSanity } from 'react-icons/si';
import { useIsMainWindow } from '@/hooks';
import { disableDraftMode } from '@/lib/actions';

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
		<div className='fixed right-8 bottom-8'>
			<button
				type='button'
				className='z-9999 flex items-center gap-2 text-nowrap rounded bg-[#EF4434] p-2 font-bold font-mono text-white text-xs uppercase disabled:bg-[#f0a59e]'
				disabled={pending}
				onClick={disable}
			>
				<SiSanity />
				{pending ? 'Disabling edit mode' : 'Disable edit mode'}
			</button>
		</div>
	);
}
