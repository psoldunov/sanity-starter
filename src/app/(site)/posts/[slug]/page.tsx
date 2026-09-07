import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PostBody from '@/components/blog/PostBody';
import PostCard from '@/components/blog/PostCard';
import Container from '@/components/layout/Container';
import SmartImage from '@/components/utility/SmartImage';
import { formatPostDate } from '@/lib/date';
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

	const canonicalUrl = `${getSiteUrl()}/posts/${slug}`;
	const ogImage = post.ogImage ?? post.coverImage ?? settings?.siteOgImage;

	return {
		title: post.metaTitle || post.title || undefined,
		description: post.metaDescription || post.excerpt || undefined,
		robots: post.noIndex ? { index: false, follow: false } : undefined,
		alternates: { canonical: canonicalUrl },
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
			<article>
				<Container className='max-w-3xl py-16'>
					<header className='mb-10'>
						{post.publishedAt && (
							<time
								dateTime={post.publishedAt}
								className='text-muted text-xs uppercase tracking-wide'
							>
								{formatPostDate(post.publishedAt)}
							</time>
						)}
						<h1 className='mt-3 text-balance font-semibold text-4xl text-foreground tracking-tight'>
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
							priority
							className='mb-12 h-auto w-full rounded-theme'
						/>
					)}

					<PostBody value={post.content} />
				</Container>
			</article>

			{relatedPosts.length > 0 && (
				<section
					aria-labelledby='related-heading'
					className='border-border border-t'
				>
					<Container className='py-16'>
						<h2
							id='related-heading'
							className='mb-8 font-semibold text-2xl text-foreground tracking-tight'
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
