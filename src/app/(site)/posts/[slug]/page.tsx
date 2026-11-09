import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PostBody from '@/components/blog/PostBody';
import PostCard from '@/components/blog/PostCard';
import Container from '@/components/layout/Container';
import JsonLd from '@/components/utility/JsonLd';
import SmartImage from '@/components/utility/SmartImage';
import { SITE_LOCALE } from '@/config';
import { STATIC_ROUTES } from '@/config/linkables';
import { formatPostDate } from '@/lib/date';
import { isDereferencedAsset } from '@/lib/image';
import { documentPath } from '@/lib/links';
import { htmlPathToMarkdownPath } from '@/lib/markdown/paths';
import { buildPostJsonLd } from '@/lib/structuredData';
import { getSiteUrl } from '@/lib/url';
import {
	getPost,
	getPostForMetadata,
	getSettingsForMetadata,
} from '@/sanity/lib/fetchers';
import { sanityFetch } from '@/sanity/lib/live';
import { POST_SLUGS_QUERY, RELATED_POSTS_QUERY } from '@/sanity/lib/queries';
import { getCachedOGImageUrl } from '@/sanity/lib/utils';

export const dynamicParams = true;

export async function generateStaticParams() {
	const { data } = await sanityFetch({
		query: POST_SLUGS_QUERY,
		stega: false,
		perspective: 'published',
	});

	return data.flatMap(({ slug }) => (slug ? [{ slug }] : []));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;

	const [post, settings] = await Promise.all([
		getPostForMetadata(slug),
		getSettingsForMetadata(),
	]);

	if (!post) {
		return { title: 'Not found' };
	}

	const siteUrl = getSiteUrl();
	const path = documentPath('post', slug);
	const canonicalUrl = `${siteUrl}${path}`;
	const ogImage = post.ogImage ?? post.coverImage ?? settings?.siteOgImage;

	return {
		title: post.metaTitle || post.title || undefined,
		description: post.metaDescription || post.excerpt || undefined,
		robots: post.noIndex ? { index: false, follow: false } : undefined,
		alternates: {
			canonical: canonicalUrl,
			// Points agents at the post's markdown. A `noIndex` post has none.
			types: post.noIndex
				? undefined
				: { 'text/markdown': `${siteUrl}${htmlPathToMarkdownPath(path)}` },
		},
		openGraph: {
			type: 'article',
			url: canonicalUrl,
			title: post.metaTitle || post.title || undefined,
			description: post.metaDescription || post.excerpt || undefined,
			publishedTime: post.publishedAt || undefined,
			images: ogImage ? [getCachedOGImageUrl(ogImage)] : [],
			siteName: settings?.siteName || undefined,
			locale: SITE_LOCALE.openGraph,
		},
	};
}

/**
 * The post's structured data, from the stega-free reads `generateMetadata`
 * already made — so it costs no second fetch, and no click-to-edit characters
 * reach the JSON-LD.
 *
 * @param props.slug - The post slug.
 * @returns The post's JSON-LD, or `null` without a post or a site name.
 */
async function PostJsonLd({ slug }: { slug: string }) {
	const [post, settings] = await Promise.all([
		getPostForMetadata(slug),
		getSettingsForMetadata(),
	]);
	const siteName = settings?.siteName;
	if (!post || !siteName) return null;

	const cover = post.coverImage?.asset;
	const indexPath = documentPath('post');
	const index = STATIC_ROUTES.find((route) => route.path === indexPath);

	return (
		<JsonLd
			data={buildPostJsonLd({
				siteUrl: getSiteUrl(),
				path: documentPath('post', slug),
				headline: post.metaTitle || post.title || siteName,
				description: post.metaDescription || post.excerpt,
				imageUrl: isDereferencedAsset(cover) ? cover.url : undefined,
				datePublished: post.publishedAt,
				dateModified: post._updatedAt,
				language: SITE_LOCALE.language,
				siteName,
				logoUrl: settings.logo?.asset?.url,
				index: index && { name: index.label, path: index.path },
			})}
		/>
	);
}

/**
 * Article template — a templated route, deliberately not built from page
 * sections. Adopters who want a builder-driven post should add sections to the
 * `post` schema and render `SectionRenderer` here instead.
 */
export default async function PostPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const post = await getPost(slug);

	if (!post) {
		notFound();
	}

	const { data: relatedPosts } = await sanityFetch({
		query: RELATED_POSTS_QUERY,
		params: { slug },
	});

	return (
		<main id='main'>
			<PostJsonLd slug={slug} />
			<article>
				<Container className='max-w-3xl py-16'>
					<header className='mb-10'>
						{post.publishedAt && (
							<time
								dateTime={post.publishedAt}
								className='text-xs tracking-wide text-muted uppercase'
							>
								{formatPostDate(post.publishedAt)}
							</time>
						)}
						<h1 className='mt-3 text-4xl font-semibold tracking-tight text-balance text-foreground'>
							{post.title}
						</h1>
						{post.excerpt && (
							<p className='mt-4 text-lg text-muted'>{post.excerpt}</p>
						)}
					</header>

					{post.coverImage?.asset && (
						<SmartImage
							image={post.coverImage}
							sizes='(min-width: 768px) 768px, 100vw'
							preload
							className='mb-12 h-auto w-full rounded-theme'
						/>
					)}

					<PostBody value={post.content} />
				</Container>
			</article>

			{relatedPosts.length > 0 && (
				<section
					aria-labelledby='related-heading'
					className='border-t border-border'
				>
					<Container className='py-16'>
						<h2
							id='related-heading'
							className='mb-8 text-2xl font-semibold tracking-tight text-foreground'
						>
							More posts
						</h2>
						<div className='grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3'>
							{relatedPosts.map((related) => (
								<PostCard key={related._id} post={related} />
							))}
						</div>
					</Container>
				</section>
			)}
		</main>
	);
}
