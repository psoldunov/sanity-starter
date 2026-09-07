import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { SectionRenderer } from '@/components/utility/SectionRenderer';
import { resolveDestinationUrl } from '@/lib/links';
import { hasDynamicParams, normalizeSlug, splitSlug } from '@/lib/slug';
import { getSiteUrl } from '@/lib/url';
import {
	getPage,
	getPageForMetadata,
	getSettingsForMetadata,
} from '@/sanity/lib/fetchers';
import { sanityFetch } from '@/sanity/lib/live';
import { PAGE_ROUTES_QUERY, REDIRECT_QUERY } from '@/sanity/lib/queries';
import { getCachedOGImageUrl } from '@/sanity/lib/utils';

export const dynamicParams = true;

export async function generateStaticParams() {
	const { data } = await sanityFetch({
		query: PAGE_ROUTES_QUERY,
		stega: false,
		perspective: 'published',
	});

	return data.flatMap(({ route }) =>
		route ? [{ slug: splitSlug(route) }] : [],
	);
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const currentPath = normalizeSlug(slug);

	// Independent reads — issued together rather than one after the other.
	const [page, settings] = await Promise.all([
		getPageForMetadata(currentPath),
		getSettingsForMetadata(),
	]);

	if (!page) {
		return { title: 'Not found' };
	}

	const siteUrl = getSiteUrl();
	const canonicalUrl =
		currentPath === '/' ? siteUrl : `${siteUrl}${currentPath}`;
	const ogImage = page.ogImage ?? settings?.siteOgImage;

	return {
		title: page.metaTitle || page.title || undefined,
		description: page.metaDescription || settings?.siteDescription || undefined,
		// Without this, a page flagged `noIndex` in the Studio is still indexable —
		// robots.txt asks crawlers not to fetch it, it does not stop indexing.
		robots: page.noIndex ? { index: false, follow: false } : undefined,
		alternates: {
			canonical: canonicalUrl,
		},
		openGraph: {
			images: ogImage ? [getCachedOGImageUrl(ogImage)] : [],
			siteName: settings?.siteName || undefined,
			type: 'website',
			url: canonicalUrl,
			locale: 'en_US',
		},
	};
}

export default async function PageComponent({
	params,
	searchParams,
}: {
	params: Promise<{ slug?: string[] }>;
	searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { slug } = await params;
	const normalizedSlug = normalizeSlug(slug);

	const page = await getPage(normalizedSlug);

	if (!page) {
		const { data: redirectData } = await sanityFetch({
			query: REDIRECT_QUERY,
			params: { slug: normalizedSlug },
			stega: false,
		});

		const destinationUrl = resolveDestinationUrl(redirectData?.destination);
		if (destinationUrl) {
			// Editor-authored destination, so `typedRoutes` cannot check it at build
			// time. `resolveDestinationUrl` is the guarantee: a static path only
			// survives `isSafeInternalPath`, which rejects the `//host` and `/\host`
			// forms that would turn this into an open redirect.
			redirect(destinationUrl as Parameters<typeof redirect>[0]);
		}

		notFound();
	}

	if (!page.sections?.length) {
		notFound();
	}

	const searchParamsObj = hasDynamicParams(page)
		? await searchParams
		: undefined;

	return (
		<main id='main'>
			{page.sections.map((section) => (
				<SectionRenderer
					key={section._key}
					section={section}
					searchParams={searchParamsObj}
				/>
			))}
		</main>
	);
}
