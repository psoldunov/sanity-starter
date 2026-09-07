import Link from 'next/link';
import { cn } from '@/lib/utils';

type PaginationProps = {
	currentPage: number;
	totalPages: number;
	/** Route the page number is appended to as `?page=`, e.g. `/posts`. */
	basePath: string;
};

/**
 * Previous/next pagination for a paged listing.
 *
 * Rendered as real links rather than buttons so the pages are crawlable and
 * work without JavaScript — `next/link` emits a plain anchor on the server, so
 * it satisfies both that and client navigation. The disabled edge is a `<span>`,
 * not a link with `aria-disabled` — a disabled anchor still takes focus and
 * still activates.
 *
 * @param props.currentPage - 1-based index of the page being shown.
 * @param props.totalPages - Total number of pages.
 * @param props.basePath - Route the `?page=` query is appended to.
 * @returns The pagination nav, or `null` when there is only one page.
 */
export default function Pagination({
	currentPage,
	totalPages,
	basePath,
}: PaginationProps) {
	if (totalPages <= 1) {
		return null;
	}

	const hasPrevious = currentPage > 1;
	const hasNext = currentPage < totalPages;

	const linkClass =
		'rounded-theme border border-border px-4 py-2 text-sm transition-colors hover:bg-surface';
	const disabledClass =
		'rounded-theme border border-border px-4 py-2 text-sm text-muted opacity-50';

	return (
		<nav
			aria-label='Pagination'
			className='mt-16 flex items-center justify-between gap-4'
		>
			{hasPrevious ? (
				<Link
					// An object href rather than a template string: `typedRoutes` can
					// check a literal route but not one assembled from a `basePath`
					// prop, and this keeps the page out of a cast.
					href={{
						pathname: basePath,
						query: currentPage === 2 ? undefined : { page: currentPage - 1 },
					}}
					rel='prev'
					className={cn(linkClass)}
				>
					← Newer
				</Link>
			) : (
				<span className={disabledClass}>← Newer</span>
			)}

			<p aria-current='page' className='text-muted text-sm'>
				Page {currentPage} of {totalPages}
			</p>

			{hasNext ? (
				<Link
					href={{ pathname: basePath, query: { page: currentPage + 1 } }}
					rel='next'
					className={cn(linkClass)}
				>
					Older →
				</Link>
			) : (
				<span className={disabledClass}>Older →</span>
			)}
		</nav>
	);
}
