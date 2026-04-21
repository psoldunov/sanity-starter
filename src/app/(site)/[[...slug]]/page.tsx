import { notFound, redirect } from 'next/navigation';
import { SectionRenderer } from '@/components/utility/SectionRenderer';
import {
	getSiteUrl,
	hasDynamicParams,
	normalizeSlug,
	splitSlug,
} from '@/lib/utils';
import { sanityFetch } from '@/sanity/lib/live';
import {
	PAGE_QUERY,
	PAGES_QUERY,
	REDIRECT_QUERY,
	SITE_SETTINGS_QUERY,
} from '@/sanity/lib/queries';
import { getCachedOGImageUrl } from '@/sanity/lib/utils';

export const dynamicParams = true;

export async function generateStaticParams() {
	const { data } = await sanityFetch({
		query: PAGES_QUERY,
		stega: false,
		perspective: 'published',
	});

	return data.flatMap((page) => {
		const current = page.route?.current;
		if (!current) return [];
		return [{ slug: splitSlug(current) }];
	});
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug?: string[] }>;
}) {
	const { slug } = await params;

	const { data: page } = await sanityFetch({
		query: PAGE_QUERY,
		params: { slug: normalizeSlug(slug) },
	});

	const { data: settings } = await sanityFetch({
		query: SITE_SETTINGS_QUERY,
	});

	if (!page) {
		return;
	}

	const siteUrl = getSiteUrl();
	const currentPath = normalizeSlug(slug);
	const canonicalUrl =
		currentPath === '/' ? siteUrl : `${siteUrl}${currentPath}`;

	return {
		title: page.metaTitle || page.title || undefined,
		description: page.metaDescription || settings?.siteDescription || undefined,
		alternates: {
			canonical: canonicalUrl,
		},
		openGraph: {
			images: [
				page.ogImage
					? getCachedOGImageUrl(page.ogImage)
					: settings?.siteOgImage
						? getCachedOGImageUrl(settings.siteOgImage)
						: '',
			].filter(Boolean),
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

	const { data: page } = await sanityFetch({
		query: PAGE_QUERY,
		params: { slug: normalizeSlug(slug) },
	});

	if (!page) {
		const { data: redirectData } = await sanityFetch({
			query: REDIRECT_QUERY,
			params: { slug: normalizeSlug(slug) },
		});

		const destinationSlug = redirectData?.destination?.route?.current;
		if (destinationSlug) {
			redirect(destinationSlug);
		}

		return notFound();
	}

	if (!page.sections?.length) {
		return notFound();
	}

	const searchParamsObj = hasDynamicParams(page)
		? await searchParams
		: undefined;

	return (
		<main>
			{page.sections.map((section, index) => (
				<SectionRenderer
					key={section._key || index}
					section={section}
					searchParams={searchParamsObj}
				/>
			))}
		</main>
	);
}
