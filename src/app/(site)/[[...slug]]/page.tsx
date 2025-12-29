import { notFound } from 'next/navigation';
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
	SITE_SETTINGS_QUERY,
} from '@/sanity/lib/queries';
import { getCachedOGImageUrl } from '@/sanity/lib/utils';
import type { Page, Settings } from '@/types';

export const dynamicParams = true;

export async function generateStaticParams() {
	console.log('Generating static params for pages...');

	const { data }: { data: Page[] } = await sanityFetch({
		query: PAGES_QUERY,
		stega: false,
		perspective: 'published',
	});

	return data.map((page) => ({
		slug: splitSlug(page.route.current),
	}));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug?: string[] }>;
}) {
	const { slug } = await params;

	const { data: page }: { data: Page } = await sanityFetch({
		query: PAGE_QUERY,
		params: { slug: normalizeSlug(slug) },
	});

	const { data: settings }: { data: Settings } = await sanityFetch({
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

	const { data: page }: { data: Page } = await sanityFetch({
		query: PAGE_QUERY,
		params: { slug: normalizeSlug(slug) },
	});

	if (!page) {
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
			{page.sections.map((section, index) => {
				// console.log(section);

				return (
					<SectionRenderer
						key={section._key || index}
						section={section}
						searchParams={searchParamsObj}
					/>
				);
			})}
		</main>
	);
}
