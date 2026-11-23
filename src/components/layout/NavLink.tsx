'use client';

import { usePathname } from 'next/navigation';
import type { ComponentProps } from 'react';
import SmartLink from '@/components/utility/SmartLink';
import { resolveLinkHref } from '@/lib/links';

/**
 * A `SmartLink` for site navigation that sets `aria-current="page"` when it
 * points at the page being viewed.
 *
 * Client leaf: only `usePathname` needs the client. Only an exact path
 * match counts (a trailing slash is ignored): a link with a `#section` or
 * `?query`, an external link and a file link are never current.
 *
 * @param props - Everything `SmartLink` accepts.
 * @returns The link element, or `null` when it has nothing to link to.
 */
export default function NavLink(props: ComponentProps<typeof SmartLink>) {
	const pathname = usePathname();
	const href = props.link.file
		? undefined
		: resolveLinkHref(props.link, undefined);
	const normalise = (path: string) =>
		path.length > 1 ? path.replace(/\/$/, '') : path;
	// A link with a #fragment or ?query points inside a page, not at it.
	const isCurrent =
		!!pathname &&
		!!href?.startsWith('/') &&
		!href.startsWith('//') &&
		!/[?#]/.test(href) &&
		normalise(href) === normalise(pathname);

	return <SmartLink aria-current={isCurrent ? 'page' : undefined} {...props} />;
}
