'use client';

import { useEffect } from 'react';

/**
 * Last-resort error boundary.
 *
 * `(site)/error.tsx` catches failures in its segment's children, not in the
 * layout that renders it — and the root layout reads site settings from the
 * Content Lake. This boundary replaces the whole document when that fails, so it
 * has to render its own `<html>` and `<body>`.
 *
 * It deliberately uses no shared layout, fonts or data: anything it imported
 * could be the thing that just failed. Styling is inline for the same reason.
 * The visitor-facing copy stays generic, like the segment boundary's.
 *
 * @param props.error - The thrown error, with a `digest` in production.
 * @param props.reset - Re-renders the failed tree.
 * @returns The fallback document.
 */
export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Runs in the browser. In production React ships only `message` and
		// `digest` to the client, so this leaks no implementation detail — but it
		// is not a server log either. Send `error.digest` to your reporting
		// service here if you have one.
		console.error('Unhandled error rendering document:', error);
	}, [error]);

	return (
		<html lang='en'>
			<body
				style={{
					margin: 0,
					minHeight: '100vh',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					padding: '1.5rem',
					fontFamily:
						'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
					background: '#fff',
					color: '#111',
				}}
			>
				<main style={{ maxWidth: '32rem', textAlign: 'center' }}>
					<h1
						style={{
							fontSize: '1.875rem',
							fontWeight: 600,
							letterSpacing: '-0.025em',
							margin: 0,
						}}
					>
						Something went wrong
					</h1>
					<p style={{ marginTop: '1rem', color: '#555', lineHeight: 1.6 }}>
						This page could not be displayed. Trying again may be enough.
					</p>
					{error.digest && (
						<p
							style={{
								marginTop: '0.5rem',
								fontFamily: 'ui-monospace, SFMono-Regular, monospace',
								fontSize: '0.75rem',
								color: '#777',
							}}
						>
							Reference: {error.digest}
						</p>
					)}
					<button
						type='button'
						onClick={reset}
						style={{
							marginTop: '2rem',
							height: '2.5rem',
							padding: '0 1rem',
							borderRadius: '0.375rem',
							border: 0,
							background: '#111',
							color: '#fff',
							fontSize: '0.875rem',
							fontWeight: 500,
							cursor: 'pointer',
						}}
					>
						Try again
					</button>
				</main>
			</body>
		</html>
	);
}
