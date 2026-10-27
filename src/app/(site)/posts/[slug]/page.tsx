import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PostBody from '@/components/blog/PostBody';
import PostCard from '@/components/blog/PostCard';
import Container from '@/components/layout/Container';
import JsonLd from '@/components/utility/JsonLd';
import SmartImage from '@/components/utility/SmartImage';
import { formatPostDate } from '@/lib/date';
import { documentPath } from '@/lib/links';
import { htmlPathToMarkdownPath } from '@/lib/markdown/paths';
import { postNodes, siteFacts } from '@/lib/structuredData';
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
			locale: 'en_US',
		},
	};
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
	// The JSON-LD reads the stega-free copies, which `generateMetadata` has
	// already fetched for this request.
	const [post, metadataPost, settings] = await Promise.all([
		getPost(slug),
		getPostForMetadata(slug),
		getSettingsForMetadata(),
	]);

	if (!post) {
		notFound();
	}

	const { data: relatedPosts } = await sanityFetch({
		query: RELATED_POSTS_QUERY,
		params: { slug },
	});

	const site = siteFacts(getSiteUrl(), settings);

	return (
		<main id='main'>
			{site && metadataPost && <JsonLd nodes={postNodes(site, metadataPost)} />}
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
