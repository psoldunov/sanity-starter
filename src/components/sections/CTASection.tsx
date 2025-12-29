import Link from 'next/link';
import Container from '@/components/layout/Container';

export default function CTASection() {
	return (
		<section className='py-20'>
			<Container className='text-center text-foreground'>
				<h2 className='mb-6 font-bold text-4xl'>Ready to Get Started?</h2>
				<p className='mb-8 text-xl opacity-90'>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
					eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
					minim veniam, quis nostrud exercitation.
				</p>
				<div className='flex justify-center gap-4'>
					<Link
						href='#'
						className='rounded-lg bg-foreground px-8 py-3 font-semibold text-background transition-opacity hover:opacity-90'
					>
						Get Started
					</Link>
					<Link
						href='#'
						className='rounded-lg border-2 border-foreground bg-transparent px-8 py-3 font-semibold text-foreground transition-colors hover:bg-foreground/10'
					>
						Learn More
					</Link>
				</div>
			</Container>
		</section>
	);
}
