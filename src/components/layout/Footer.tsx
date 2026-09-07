import Container from '@/components/layout/Container';
import SmartLink from '@/components/utility/SmartLink';
import type { FooterNavColumn } from '@/types';

type FooterProps = {
	nav?: FooterNavColumn[] | null;
	siteName?: string | null;
};

/**
 * Column-count classes, written out in full.
 *
 * Tailwind scans source text for complete class names, so an interpolated
 * `md:grid-cols-${n}` is never emitted and the footer silently stays
 * single-column on desktop. A lookup keeps the literals visible to the scanner.
 */
const COLUMN_GRID: Record<number, string> = {
	1: 'md:grid-cols-1',
	2: 'md:grid-cols-2',
	3: 'md:grid-cols-3',
	4: 'md:grid-cols-4',
};

/**
 * Site footer: navigation columns from site settings plus a copyright line.
 *
 * @param props.nav - Footer navigation columns.
 * @param props.siteName - Site name shown in the copyright line.
 * @returns The site footer element.
 */
export default function Footer({ nav, siteName }: FooterProps) {
	const columns = nav ?? [];
	const columnClass = COLUMN_GRID[Math.min(Math.max(columns.length, 1), 4)];

	return (
		<footer className='mt-24 border-border border-t'>
			<Container>
				<div className='py-12'>
					{columns.length > 0 && (
						<nav
							aria-label='Footer'
							className={`grid grid-cols-1 gap-8 sm:grid-cols-2 ${columnClass}`}
						>
							{columns.map((column) => (
								<div key={column._key}>
									<h2 className='mb-4 font-semibold text-base text-foreground'>
										{column.heading}
									</h2>
									<ul className='flex flex-col gap-2'>
										{column.links?.map((link) => (
											<li key={link._key}>
												<SmartLink
													link={link}
													className='text-muted text-sm transition-colors hover:text-foreground'
												/>
											</li>
										))}
									</ul>
								</div>
							))}
						</nav>
					)}
					<div className='mt-8 border-border border-t pt-8 text-center text-muted text-sm'>
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
