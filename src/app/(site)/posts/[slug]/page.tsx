import { notFound } from 'next/navigation';
import { groq } from 'next-sanity';
import { sanityFetch } from '@/sanity/lib/live';

export default async function PostPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;

	const { data: post } = await sanityFetch({
		query: groq`*[_type == "post" && slug.current == $slug][0]{
			...,
		}`,
		params: { slug },
	});

	if (!post) {
		return notFound();
	}

	return <h1>{post.title}</h1>;
}
