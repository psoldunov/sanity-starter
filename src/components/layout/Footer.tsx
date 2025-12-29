import Link from 'next/link';
import Container from './Container';

export default function Footer() {
	return (
		<footer className='border-foreground/10 border-t'>
			<Container>
				<div className='py-12'>
					<div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
						<div>
							<h3 className='mb-4 font-semibold text-foreground'>Company</h3>
							<ul className='flex flex-col gap-2 text-foreground/70'>
								<li>
									<Link
										href='/about'
										className='transition-colors hover:text-foreground'
									>
										About
									</Link>
								</li>
								<li>
									<Link
										href='/careers'
										className='transition-colors hover:text-foreground'
									>
										Careers
									</Link>
								</li>
								<li>
									<Link
										href='/contact'
										className='transition-colors hover:text-foreground'
									>
										Contact
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<h3 className='mb-4 font-semibold text-foreground'>Resources</h3>
							<ul className='flex flex-col gap-2 text-foreground/70'>
								<li>
									<Link
										href='/docs'
										className='transition-colors hover:text-foreground'
									>
										Documentation
									</Link>
								</li>
								<li>
									<Link
										href='/support'
										className='transition-colors hover:text-foreground'
									>
										Support
									</Link>
								</li>
								<li>
									<Link
										href='/blog'
										className='transition-colors hover:text-foreground'
									>
										Blog
									</Link>
								</li>
							</ul>
						</div>
						<div>
							<h3 className='mb-4 font-semibold text-foreground'>Legal</h3>
							<ul className='flex flex-col gap-2 text-foreground/70'>
								<li>
									<Link
										href='/privacy'
										className='transition-colors hover:text-foreground'
									>
										Privacy
									</Link>
								</li>
								<li>
									<Link
										href='/terms'
										className='transition-colors hover:text-foreground'
									>
										Terms
									</Link>
								</li>
								<li>
									<Link
										href='/cookies'
										className='transition-colors hover:text-foreground'
									>
										Cookies
									</Link>
								</li>
							</ul>
						</div>
					</div>
					<div className='mt-8 border-foreground/10 border-t pt-8 text-center text-foreground/70'>
						<p>
							&copy; {new Date().getFullYear()} Company Name. All rights
							reserved.
						</p>
					</div>
				</div>
			</Container>
		</footer>
	);
}
