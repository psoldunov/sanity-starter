import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { draftMode } from 'next/headers';
import { VisualEditing } from 'next-sanity/visual-editing';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import DisableDraftMode from '@/components/utility/DisableDraftMode';
import { geistMono, geistSans } from '@/fonts';
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

export async function generateMetadata(): Promise<Metadata> {
	const settings = await getSettingsForMetadata();
	const baseUrl = getSiteUrl();

	return {
		metadataBase: new URL(baseUrl),
		title: {
			default: settings?.siteName || 'Sanity Starter',
			template: `%s | ${settings?.siteName || 'Sanity Starter'}`,
		},
		description: settings?.siteDescription || '',
		alternates: {
			canonical: '/',
		},
		openGraph: {
			type: 'website',
			url: baseUrl,
			images: settings?.siteOgImage
				? [getCachedOGImageUrl(settings.siteOgImage)]
				: [],
			siteName: settings?.siteName || '',
			locale: 'en_US',
		},
	};
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
		<html lang='en' suppressHydrationWarning>
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
