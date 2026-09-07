'use client';

import { useEffect } from 'react';
import Button from '@/components/elements/Button';
import Container from '@/components/layout/Container';

/**
 * Error boundary for the public site.
 *
 * Must be a Client Component — React needs `reset` to run in the browser. The
 * message shown to visitors is deliberately generic: in production React ships
 * only `message` and `digest` to the client, so the stack never reaches the
 * page.
 *
 * @param props.error - The thrown error, with a `digest` in production.
 * @param props.reset - Re-renders the failed segment.
 * @returns The error view.
 */
export default function SiteError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Runs in the browser, not on the server — this is a Client Component.
		// Send `error.digest` to your reporting service here if you have one; the
		// server-side stack is already in the platform log under that digest.
		console.error('Unhandled error rendering page:', error);
	}, [error]);

	return (
		<main id='main'>
			<Container className='flex min-h-[60vh] max-w-xl flex-col items-center justify-center py-24 text-center'>
				<h1 className='font-semibold text-3xl text-foreground tracking-tight'>
					Something went wrong
				</h1>
				<p className='mt-4 text-muted'>
					This page could not be displayed. Trying again may be enough.
				</p>
				{error.digest && (
					<p className='mt-2 font-mono text-muted text-xs'>
						Reference: {error.digest}
					</p>
				)}
				<Button type='button' onClick={reset} className='mt-8'>
					Try again
				</Button>
			</Container>
		</main>
	);
}
