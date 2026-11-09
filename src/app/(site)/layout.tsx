import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { draftMode } from 'next/headers';
import { VisualEditing } from 'next-sanity/visual-editing';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import DisableDraftMode from '@/components/utility/DisableDraftMode';
import JsonLd from '@/components/utility/JsonLd';
import { SITE_LOCALE } from '@/config';
import { geistMono, geistSans } from '@/fonts';
import { buildSiteJsonLd } from '@/lib/structuredData';
import { getSiteUrl } from '@/lib/url';
import { cn } from '@/lib/utils';
import { getSettings, getSettingsForMetadata } from '@/sanity/lib/fetchers';
import { SanityLive } from '@/sanity/lib/live';
import { getCachedOGImageUrl } from '@/sanity/lib/utils';

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	colorScheme: 'light dark',
};

/**
 * Site-wide defaults every route inherits.
 *
 * No `alternates.canonical` and no `openGraph.url` here: a route that does not
 * set its own would inherit them, and the 404 page would then declare the
 * home page its canonical URL. Each page sets both for itself.
 */
export async function generateMetadata(): Promise<Metadata> {
	const settings = await getSettingsForMetadata();

	return {
		metadataBase: new URL(getSiteUrl()),
		title: {
			default: settings?.siteName || 'Sanity Starter',
			template: `%s | ${settings?.siteName || 'Sanity Starter'}`,
		},
		description: settings?.siteDescription || '',
		openGraph: {
			type: 'website',
			images: settings?.siteOgImage
				? [getCachedOGImageUrl(settings.siteOgImage)]
				: [],
			siteName: settings?.siteName || '',
			locale: SITE_LOCALE.openGraph,
		},
	};
}

/**
 * The site-wide structured data: the organisation and the website, which
 * every page's own graph points back to.
 *
 * Reads the stega-free settings `generateMetadata` already fetched, so it
 * costs no second request and no click-to-edit characters reach the JSON-LD.
 * Without a site name there is no entity to describe yet, so it renders
 * nothing.
 *
 * @returns The site's JSON-LD, or `null`.
 */
async function SiteJsonLd() {
	const settings = await getSettingsForMetadata();
	if (!settings?.siteName) return null;

	return (
		<JsonLd
			data={buildSiteJsonLd({
				siteUrl: getSiteUrl(),
				name: settings.siteName,
				description: settings.siteDescription,
				logoUrl: settings.logo?.asset?.url,
				sameAs: settings.socialLinks,
				language: SITE_LOCALE.language,
			})}
		/>
	);
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const [settings, { isEnabled: isDraft }] = await Promise.all([
		getSettings(),
		draftMode(),
	]);

	return (
		<html lang={SITE_LOCALE.language} suppressHydrationWarning>
			<body
				className={cn(
					geistSans.variable,
					geistMono.variable,
					'flex min-h-dvh flex-col',
				)}
			>
				<Header
					menu={settings?.headerMenu}
					logo={settings?.logo}
					siteName={settings?.siteName}
				/>
				<div className='flex-1'>{children}</div>
				<Footer nav={settings?.footerNav} siteName={settings?.siteName} />
				<SiteJsonLd />
				<SanityLive />
				{isDraft && (
					<>
						<DisableDraftMode />
						<VisualEditing />
					</>
				)}
			</body>
		</html>
	);
}
