import Link from 'next/link';
import SmartImage from '@/components/utility/SmartImage';
import { formatPostDate } from '@/lib/date';
import type { PostListItem } from '@/types';

type PostCardProps = {
	post: PostListItem;
	/**
	 * Set on the first card above the fold so its image is not lazy-loaded —
	 * on the blog index that image is usually the LCP element.
	 */
	priority?: boolean;
};

/**
 * Listing card for a post, used by the blog index and the related-posts strip.
 *
 * The whole card is one link: the heading carries the accessible name and the
 * image is marked decorative, so a screen reader announces the post once rather
 * than twice.
 *
 * @param props.post - Post as projected by `POSTS_PAGE_QUERY`.
 * @param props.priority - Eagerly load the cover image.
 * @returns An article card linking to the post.
 */
export default function PostCard({ post, priority }: PostCardProps) {
	return (
		<article className='group relative flex flex-col gap-4'>
			{post.coverImage?.asset && (
				<div className='relative aspect-[16/9] overflow-hidden rounded-theme bg-surface'>
					<SmartImage
						image={post.coverImage}
						fill
						decorative
						priority={priority}
						sizes='(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'
						className='object-cover transition-transform duration-300 group-hover:scale-[1.02]'
					/>
				</div>
			)}

			<div className='flex flex-col gap-2'>
				{post.publishedAt && (
					<time
						dateTime={post.publishedAt}
						className='text-muted text-xs uppercase tracking-wide'
					>
						{formatPostDate(post.publishedAt)}
					</time>
				)}

				<h2 className='font-semibold text-foreground text-lg tracking-tight'>
					{/* Stretched link: the card is the hit area, the heading is the name. */}
					{/* The slug is encoded — it is API-writable, so it can hold a
					    character that would otherwise break the URL. */}
					<Link
						href={`/posts/${encodeURIComponent(post.slug)}`}
						className='before:absolute before:inset-0'
					>
						{post.title}
					</Link>
				</h2>

				{post.excerpt && (
					<p className='line-clamp-3 text-muted text-sm/6'>{post.excerpt}</p>
				)}
			</div>
		</article>
	);
}
