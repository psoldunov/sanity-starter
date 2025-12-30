import type { SmartLinkProps } from '@/types';
import SmartLink from '../utility/SmartLink';
import Container from './Container';

export default function Header({ menu }: { menu?: SmartLinkProps[] }) {
	return (
		<header className='border-foreground/10 border-b'>
			<Container>
				<nav className='flex h-16 items-center justify-between'>
					<div className='font-bold text-foreground text-xl'>Logo</div>
					<ul className='flex gap-6'>
						{menu?.map((link) => (
							<li key={link._key}>
								<SmartLink
									link={link}
									className='text-foreground/70 transition-colors hover:text-foreground'
								/>
							</li>
						))}
					</ul>
				</nav>
			</Container>
		</header>
	);
}
