import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Provider } from 'jotai';
import { draftMode } from 'next/headers';
import { VisualEditing } from 'next-sanity/visual-editing';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import DisableDraftMode from '@/components/utility/DisableDraftMode';
import { geistMono, geistSans } from '@/fonts';
import { getSiteUrl } from '@/lib/url';
import { cn } from '@/lib/utils';
import { SanityLive, sanityFetch } from '@/sanity/lib/live';
import { SITE_SETTINGS_QUERY } from '@/sanity/lib/queries';
import { getCachedOGImageUrl } from '@/sanity/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
	const { data: settings } = await sanityFetch({
		query: SITE_SETTINGS_QUERY,
	});

	const baseUrl = getSiteUrl();

	return {
		metadataBase: new URL(baseUrl),
		title: {
			default: settings?.siteName || '',
			template: `%s | ${settings?.siteName || ''}`,
		},
		alternates: {
			canonical: baseUrl,
		},
		description: settings?.siteDescription || '',
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
	const { data: settings } = await sanityFetch({
		query: SITE_SETTINGS_QUERY,
	});

	return (
		<Provider>
			<html lang='en'>
				<body className={cn(geistSans.variable, geistMono.variable)}>
					<Header menu={settings?.headerMenu} />
					{children}
					<Footer nav={settings?.footerNav} siteName={settings?.siteName} />
					<SanityLive />
					{(await draftMode()).isEnabled && (
						<>
							<DisableDraftMode />
							<VisualEditing />
						</>
					)}
				</body>
			</html>
		</Provider>
	);
}
