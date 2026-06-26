import SmartLink from '@/components/utility/SmartLink';
import type { FooterNavColumn } from '@/types';
import Container from './Container';

type FooterProps = {
	nav?: FooterNavColumn[] | null;
	siteName?: string;
};

export default function Footer({ nav, siteName }: FooterProps) {
	const columns = nav ?? [];

	return (
		<footer className='border-foreground/10 border-t'>
			<Container>
				<div className='py-12'>
					{columns.length > 0 && (
						<div
							className={`grid grid-cols-1 gap-8 sm:grid-cols-2 ${columns.length >= 4 ? 'md:grid-cols-4' : `md:grid-cols-${Math.min(columns.length, 3)}`}`}
						>
							{columns.map((column) => (
								<div key={column._key}>
									<h3 className='mb-4 font-semibold text-foreground'>
										{column.heading}
									</h3>
									<ul className='flex flex-col gap-2 text-foreground/70'>
										{column.links?.map((link) => (
											<li key={link._key}>
												<SmartLink
													link={link}
													className='transition-colors hover:text-foreground'
												/>
											</li>
										))}
									</ul>
								</div>
							))}
						</div>
					)}
					<div className='mt-8 border-foreground/10 border-t pt-8 text-center text-foreground/70'>
						<p>
							&copy; {new Date().getFullYear()} {siteName || 'Company Name'}.
							All rights reserved.
						</p>
					</div>
				</div>
			</Container>
		</footer>
	);
}
