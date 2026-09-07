import Container from '@/components/layout/Container';

/**
 * Route-level loading state for the public site.
 *
 * A skeleton rather than a spinner: it reserves roughly the space the content
 * will occupy, so the swap does not shift layout.
 *
 * @returns The loading skeleton.
 */
export default function Loading() {
	return (
		<main id='main' aria-busy='true' aria-live='polite'>
			<span className='sr-only'>Loading</span>
			<Container className='py-16'>
				<div className='max-w-2xl animate-pulse space-y-4'>
					<div className='h-10 w-2/3 rounded-theme bg-surface' />
					<div className='h-5 w-full rounded-theme bg-surface' />
					<div className='h-5 w-4/5 rounded-theme bg-surface' />
				</div>
				<div className='mt-12 grid animate-pulse grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3'>
					<div className='aspect-[16/9] rounded-theme bg-surface' />
					<div className='aspect-[16/9] rounded-theme bg-surface' />
					<div className='aspect-[16/9] rounded-theme bg-surface' />
				</div>
			</Container>
		</main>
	);
}
