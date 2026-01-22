import { notFound } from 'next/navigation';
import Container from '@/components/layout/Container';
import { sanityFetch } from '@/sanity/lib/live';
import { POST_QUERY, POSTS_QUERY } from '@/sanity/lib/queries';
import type { Post } from '@/types';

export async function generateStaticParams() {
	const { data: posts }: { data: Post[] } = await sanityFetch({
		query: POSTS_QUERY,
		stega: false,
		perspective: 'published',
	});

	if (!posts || posts.length === 0) {
		return [];
	}

	return posts
		.filter((post) => post.slug?.current)
		.map((post) => ({
			slug: post.slug.current,
		}));
}

export default async function PostPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;

	const { data: post } = await sanityFetch({
		query: POST_QUERY,
		params: { slug },
	});

	if (!post) {
		return notFound();
	}

	return (
		<section className='py-12'>
			<Container>
				<h1>{post.title}</h1>
			</Container>
		</section>
	);
}
