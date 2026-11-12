import type { Metadata } from 'next';
import { notFound, permanentRedirect, redirect } from 'next/navigation';
import JsonLd from '@/components/utility/JsonLd';
import { SectionRenderer } from '@/components/utility/SectionRenderer';
import { SITE_LOCALE } from '@/config';
import { htmlPathToMarkdownPath } from '@/lib/markdown/paths';
import { resolveRedirect } from '@/lib/redirects';
import { hasDynamicParams, normalizeSlug, splitSlug } from '@/lib/slug';
import { buildPageJsonLd } from '@/lib/structuredData';
import { getSiteUrl, toAbsoluteUrl } from '@/lib/url';
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
	const canonicalUrl = toAbsoluteUrl(siteUrl, currentPath);
	const ogImage = page.ogImage ?? settings?.siteOgImage;

	return {
		title: page.metaTitle || page.title || undefined,
		description: page.metaDescription || settings?.siteDescription || undefined,
		// Without this, a page flagged `noIndex` in the Studio is still indexable —
		// robots.txt asks crawlers not to fetch it, it does not stop indexing.
		robots: page.noIndex ? { index: false, follow: false } : undefined,
		alternates: {
			canonical: canonicalUrl,
			// Points agents at the page's markdown. A `noIndex` page has none.
			types: page.noIndex
				? undefined
				: {
						'text/markdown': `${siteUrl}${htmlPathToMarkdownPath(currentPath)}`,
					},
		},
		openGraph: {
			images: ogImage ? [getCachedOGImageUrl(ogImage)] : [],
			siteName: settings?.siteName || undefined,
			type: 'website',
			url: canonicalUrl,
			locale: SITE_LOCALE.openGraph,
		},
	};
}

/**
 * The page's structured data, from the stega-free reads `generateMetadata`
 * already made — so it costs no second fetch, and no click-to-edit characters
 * reach the JSON-LD.
 *
 * @param props.slug - Normalised route, e.g. `/about`.
 * @returns The page's JSON-LD, or `null` without a page or a site name.
 */
async function PageJsonLd({ slug }: { slug: string }) {
	const [page, settings] = await Promise.all([
		getPageForMetadata(slug),
		getSettingsForMetadata(),
	]);
	const siteName = settings?.siteName;
	if (!page || !siteName) return null;

	const siteUrl = getSiteUrl();
	const ogImage = page.ogImage ?? settings.siteOgImage;
	// Only the questions a visitor can see: a hidden section is not rendered.
	const faqs = (page.sections ?? []).flatMap((section) =>
		section._type === 'faqSection' && !section.hidden
			? (section.items ?? [])
			: [],
	);

	return (
		<JsonLd
			data={buildPageJsonLd({
				siteUrl,
				path: slug,
				name:
					slug === '/' ? siteName : page.title || page.metaTitle || siteName,
				description: page.metaDescription || settings.siteDescription,
				imageUrl: ogImage
					? `${siteUrl}${getCachedOGImageUrl(ogImage)}`
					: undefined,
				language: SITE_LOCALE.language,
				homeName: siteName,
				faqs,
				type: page.geo?.schemaType,
				dateModified: page._updatedAt,
			})}
		/>
	);
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

		const match = resolveRedirect(redirectData, normalizedSlug);
		if (match) {
			// Editor-authored destination, so `typedRoutes` cannot check it at build
			// time. `resolveRedirect` is the guarantee: every branch ends in
			// `isSafeInternalPath`, which rejects the `//host` and `/\host` forms
			// that would turn this into an open redirect.
			const url = match.url as Parameters<typeof redirect>[0];

			// 308 for a permanent move, so the old route's ranking passes to the
			// destination. A 307 tells search engines to keep indexing the old URL,
			// which is the wrong answer for a route that has genuinely moved.
			if (match.statusCode === 308) {
				permanentRedirect(url);
			}

			redirect(url);
		}

		notFound();
	}

	if (!page.sections?.length) {
		notFound();
	}

	const searchParamsObj = hasDynamicParams(page)
		? await searchParams
		: undefined;

	// A hidden section renders as null outside draft mode, so it must not take
	// the first-section slot (and its LCP preload) from the first visible one.
	const firstVisibleIndex = page.sections.findIndex(
		(section) => !section.hidden,
	);

	return (
		<main id='main'>
			<PageJsonLd slug={normalizedSlug} />
			{page.sections.map((section, index) => (
				<SectionRenderer
					key={section._key}
					section={section}
					searchParams={searchParamsObj}
					isFirstSection={index === firstVisibleIndex}
				/>
			))}
		</main>
	);
}
