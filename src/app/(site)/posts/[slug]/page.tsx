import { notFound } from 'next/navigation';
import Container from '@/components/layout/Container';
import { sanityFetch } from '@/sanity/lib/live';
import { POST_QUERY } from '@/sanity/lib/queries';

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
