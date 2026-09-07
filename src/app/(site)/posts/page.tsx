import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Pagination from '@/components/blog/Pagination';
import PostCard from '@/components/blog/PostCard';
import Container from '@/components/layout/Container';
import { getSettingsForMetadata } from '@/sanity/lib/fetchers';
import { sanityFetch } from '@/sanity/lib/live';
import { POSTS_COUNT_QUERY, POSTS_PAGE_QUERY } from '@/sanity/lib/queries';

/** Posts shown per page of the index. */
const PAGE_SIZE = 9;

export async function generateMetadata(): Promise<Metadata> {
	const settings = await getSettingsForMetadata();

	return {
		title: 'Blog',
		description:
			settings?.siteDescription || 'Writing, updates and announcements.',
		alternates: { canonical: '/posts' },
	};
}

/**
 * Parses the `page` search param into a 1-based page number.
 *
 * Digits only, deliberately. `Number.parseInt` reads `'1e10'` as `1` and stops
 * at the first non-digit, so a lenient parse serves page-one content at an
 * unbounded number of distinct URLs. Anything that is not a plain positive
 * integer is not a page, and the caller turns it into a 404.
 *
 * @param value - Raw search param value.
 * @returns A page number of at least 1, or `null` when the param is not one.
 */
function parsePageParam(value: string | string[] | undefined): number | null {
	const raw = Array.isArray(value) ? value[0] : value;
	if (raw === undefined) return 1;

	if (!/^\d+$/.test(raw)) return null;

	const parsed = Number(raw);
	return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Blog index — a templated route, deliberately not built from page sections.
 *
 * Paging happens in GROQ (`[$start...$end]`) rather than by fetching every post
 * and slicing in the app, so page 12 costs the same as page 1.
 */
export default async function PostsIndexPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const { page: pageParam } = await searchParams;
	const currentPage = parsePageParam(pageParam);
	if (currentPage === null) notFound();

	const start = (currentPage - 1) * PAGE_SIZE;

	const [{ data: posts }, { data: total }] = await Promise.all([
		sanityFetch({
			query: POSTS_PAGE_QUERY,
			params: { start, end: start + PAGE_SIZE },
		}),
		sanityFetch({ query: POSTS_COUNT_QUERY, stega: false }),
	]);

	const totalPages = Math.max(1, Math.ceil((total ?? 0) / PAGE_SIZE));

	// Past the last page is a real 404, not a 200 rendering the empty state —
	// otherwise `?page=<n>` is an unbounded crawlable space of soft-404s.
	if (currentPage > totalPages) notFound();

	return (
		<main id='main'>
			<Container className='py-16'>
				<header className='mb-12 max-w-2xl'>
					<h1 className='font-semibold text-4xl text-foreground tracking-tight'>
						Blog
					</h1>
					<p className='mt-4 text-lg text-muted'>
						Writing, updates and announcements.
					</p>
				</header>

				{posts.length === 0 ? (
					<p className='rounded-theme border border-border border-dashed p-12 text-center text-muted'>
						No posts published yet.
					</p>
				) : (
					<div className='grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3'>
						{posts.map((post, index) => (
							<PostCard
								key={post._id}
								post={post}
								priority={currentPage === 1 && index < 3}
							/>
						))}
					</div>
				)}

				<Pagination
					currentPage={currentPage}
					totalPages={totalPages}
					basePath='/posts'
				/>
			</Container>
		</main>
	);
}
