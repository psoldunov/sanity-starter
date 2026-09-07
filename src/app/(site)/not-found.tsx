import Button from '@/components/elements/Button';
import Container from '@/components/layout/Container';
import SmartLink from '@/components/utility/SmartLink';

export const metadata = {
	title: 'Page not found',
};

/**
 * 404 page for the public site.
 *
 * @returns The not-found view.
 */
export default function NotFound() {
	return (
		<main id='main'>
			<Container className='flex min-h-[60vh] max-w-xl flex-col items-center justify-center py-24 text-center'>
				<p className='font-mono text-muted text-sm'>404</p>
				<h1 className='mt-4 font-semibold text-3xl text-foreground tracking-tight'>
					This page does not exist
				</h1>
				<p className='mt-4 text-muted'>
					The link may be out of date, or the page may have been moved.
				</p>
				{/* `asChild` projects the button styling onto the link, so this stays
				    an anchor and keeps its navigation semantics. */}
				<Button asChild className='mt-8'>
					<SmartLink link={{ href: '/' }}>Back to home</SmartLink>
				</Button>
			</Container>
		</main>
	);
}
