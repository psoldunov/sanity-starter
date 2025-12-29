import Link from 'next/link';
import Container from './Container';

export default function Header() {
	return (
		<header className='border-foreground/10 border-b'>
			<Container>
				<nav className='flex h-16 items-center justify-between'>
					<div className='font-bold text-foreground text-xl'>Logo</div>
					<ul className='flex gap-6'>
						<li>
							<Link
								href='/'
								className='text-foreground/70 transition-colors hover:text-foreground'
							>
								Home
							</Link>
						</li>
						<li>
							<Link
								href='/about'
								className='text-foreground/70 transition-colors hover:text-foreground'
							>
								About
							</Link>
						</li>
						<li>
							<Link
								href='/contact'
								className='text-foreground/70 transition-colors hover:text-foreground'
							>
								Contact
							</Link>
						</li>
					</ul>
				</nav>
			</Container>
		</header>
	);
}
