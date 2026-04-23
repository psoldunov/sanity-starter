import type { LinkProps } from 'next/link';
import Link from 'next/link';
import { getTarget } from '@/lib/url';
import { cn } from '@/lib/utils';
import { getSanityFileUrl } from '@/sanity/lib/utils';
import type { NavLinkItem } from '@/types';

export default function SmartLink(
	props: Omit<LinkProps, 'href'> & {
		link: NavLinkItem;
		children?: React.ReactNode;
		className?: string;
		style?: React.CSSProperties;
		disabled?: boolean;
		target?: string;
	},
) {
	const { link, children, disabled, className, target, ...linkProps } = props;

	const fileUrl = link.file ? getSanityFileUrl(link.file).url : undefined;
	const routeSlug = link.page?.route?.current;
	const pageUrl = routeSlug
		? `${routeSlug}${link.sectionId ? `#${link.sectionId}` : ''}`
		: undefined;

	const href = fileUrl ?? link.href ?? pageUrl ?? '#';
	const computedTarget = getTarget(href);

	return (
		<Link
			href={href}
			aria-disabled={disabled}
			target={target ?? computedTarget}
			className={cn(className, { 'pointer-events-none opacity-33': disabled })}
			rel={
				computedTarget === '_blank'
					? link.rel || 'noopener noreferrer'
					: undefined
			}
			{...linkProps}
		>
			{children || link.label || 'Link'}
		</Link>
	);
}
