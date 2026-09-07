import Link from 'next/link';
import type { AnchorHTMLAttributes, ComponentProps, ReactNode } from 'react';
import { resolveLinkHref, resolveLinkRel } from '@/lib/links';
import { getTarget, isExternalUrl } from '@/lib/url';
import { cn } from '@/lib/utils';
import { getSanityFileUrl } from '@/sanity/lib/utils';
import type { SmartLinkProps } from '@/types';

type SmartLinkComponentProps = Omit<
	AnchorHTMLAttributes<HTMLAnchorElement>,
	'href'
> & {
	link: SmartLinkProps;
	children?: ReactNode;
	disabled?: boolean;
	prefetch?: boolean;
};

/**
 * Renders a link from the CMS `link` shape, resolving its destination in order:
 * file download, external URL, internal destination.
 *
 * A link with no resolvable destination renders nothing rather than an
 * `href='#'` that goes nowhere, and a disabled link renders as a `<span>` — an
 * `<a>` with `pointer-events-none` still takes focus and still activates on
 * Enter, which fails WCAG 2.1.1.
 *
 * @param props.link - The queried link, with `page` dereferenced.
 * @param props.disabled - Renders inert, non-focusable text instead of a link.
 * @returns The link element, or `null` when there is nothing to link to.
 */
export default function SmartLink(props: SmartLinkComponentProps) {
	// `prefetch` is destructured out rather than left in `anchorProps`: it means
	// something to `next/link` and nothing to a plain `<a>`, where it would be
	// spread onto the DOM as a stray attribute.
	const {
		link,
		children,
		disabled,
		className,
		target,
		rel,
		prefetch,
		...anchorProps
	} = props;

	const fileUrl = link.file ? getSanityFileUrl(link.file).url : undefined;
	const href = resolveLinkHref(link, fileUrl);
	const label = children ?? link.label;

	if (!href || !label) {
		return null;
	}

	if (disabled) {
		return (
			<span
				aria-disabled='true'
				className={cn('cursor-not-allowed opacity-50', className)}
			>
				{label}
			</span>
		);
	}

	const computedTarget = target ?? getTarget(href);
	const isExternal = isExternalUrl(href);

	// `next/link` prefetching and client navigation only apply to internal
	// routes; an external href is better served by a plain anchor.
	if (isExternal) {
		return (
			<a
				href={href}
				target={computedTarget}
				rel={resolveLinkRel({
					target: computedTarget,
					rel,
					linkRel: link.rel,
				})}
				download={fileUrl ? '' : undefined}
				className={className}
				{...anchorProps}
			>
				{label}
			</a>
		);
	}

	return (
		<Link
			// `typedRoutes` checks href against the routes that exist at build time,
			// which it cannot do for a path assembled from CMS content at request
			// time. The guarantee here is runtime instead: `resolveDestinationUrl`
			// only ever returns a route it built from a real document, or a
			// `staticPath` that passed `isSafeInternalPath`. The check still applies
			// to every literal `<Link href>` elsewhere in the app.
			href={href as ComponentProps<typeof Link>['href']}
			target={computedTarget}
			rel={resolveLinkRel({ target: computedTarget, rel, linkRel: link.rel })}
			prefetch={prefetch}
			className={className}
			{...anchorProps}
		>
			{label}
		</Link>
	);
}
