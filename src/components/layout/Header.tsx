import Container from '@/components/layout/Container';
import SmartImage from '@/components/utility/SmartImage';
import SmartLink from '@/components/utility/SmartLink';
import type { NavLinkItem, SiteSettings } from '@/types';

type HeaderProps = {
	menu?: NavLinkItem[] | null;
	logo?: SiteSettings['logo'];
	siteName?: string | null;
};

/**
 * Site header: brand, primary navigation, and the skip link that lets keyboard
 * users jump past the nav.
 *
 * The small-screen menu is a native `<details>` disclosure rather than a
 * JavaScript dropdown. That keeps the whole header a Server Component, adds
 * nothing to the bundle, and works before hydration — the trade is that it
 * cannot animate or close on outside click.
 *
 * @param props.menu - Header links from site settings.
 * @param props.logo - Optional logo image; the site name is used when absent.
 * @param props.siteName - Site name, used as the brand text and logo alt.
 * @returns The site header element.
 */
export default function Header({ menu, logo, siteName }: HeaderProps) {
	const links = menu ?? [];
	const brand = siteName || 'Home';

	return (
		<header className='sticky top-0 z-40 border-border border-b bg-background/85 backdrop-blur-sm'>
			<a
				href='#main'
				className='sr-only rounded-theme bg-accent px-4 py-2 text-accent-foreground focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50'
			>
				Skip to content
			</a>
			<Container>
				<nav aria-label='Main' className='flex h-16 items-center gap-6'>
					<SmartLink
						link={{ href: '/' }}
						className='flex shrink-0 items-center gap-2 font-semibold text-foreground text-lg tracking-tight'
					>
						{logo?.asset ? (
							<SmartImage
								image={logo}
								height={32}
								sizes='160px'
								alt={brand}
								className='h-8 w-auto'
							/>
						) : (
							brand
						)}
					</SmartLink>

					<ul className='ml-auto hidden items-center gap-6 md:flex'>
						{links.map((link) => (
							<li key={link._key}>
								<SmartLink
									link={link}
									className='text-muted text-sm transition-colors hover:text-foreground'
								/>
							</li>
						))}
					</ul>

					{links.length > 0 && (
						<details className='relative ml-auto md:hidden'>
							<summary
								className='flex cursor-pointer list-none items-center rounded-theme p-2 text-foreground'
								aria-label='Toggle navigation menu'
							>
								<svg
									width='24'
									height='24'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='2'
									strokeLinecap='round'
									aria-hidden='true'
								>
									<title>Menu</title>
									<path d='M3 6h18M3 12h18M3 18h18' />
								</svg>
							</summary>
							<ul className='absolute right-0 z-50 mt-2 flex w-56 flex-col gap-1 rounded-theme border border-border bg-background p-2 shadow-lg'>
								{links.map((link) => (
									<li key={link._key}>
										<SmartLink
											link={link}
											className='block rounded px-3 py-2 text-muted text-sm hover:bg-surface hover:text-foreground'
										/>
									</li>
								))}
							</ul>
						</details>
					)}
				</nav>
			</Container>
		</header>
	);
}
