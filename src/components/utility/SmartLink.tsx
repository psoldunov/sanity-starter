import type { LinkProps } from 'next/link';
import Link from 'next/link';
import { cn, getTarget } from '@/lib/utils';
import { getSanityFileUrl } from '@/sanity/lib/utils';
import type { SmartLinkProps } from '@/types';

export default function SmartLink(
	props: Omit<LinkProps, 'href'> & {
		link: SmartLinkProps;
		children?: React.ReactNode;
		className?: string;
		style?: React.CSSProperties;
		disabled?: boolean;
		target?: string;
	},
) {
	const { link, children, onClick, disabled, className, target, ...linkProps } =
		props;

	const routeSlug = link.page?.route?.current;
	const sectionId = link.sectionId;

	const url =
		link.href ??
		(routeSlug ? `${routeSlug}${sectionId ? `#${sectionId}` : ''}` : '#');

	const fileUrl = link?.file && getSanityFileUrl(link.file).url;

	return (
		<Link
			href={fileUrl ?? url}
			aria-disabled={disabled}
			target={target ?? getTarget(fileUrl ?? url)}
			className={cn(className, { 'pointer-events-none opacity-33': disabled })}
			{...linkProps}
			onClick={onClick}
			rel={getTarget(fileUrl ?? url) === '_blank' ? link.rel : undefined}
		>
			{children || link.label || 'Link'}
		</Link>
	);
}
