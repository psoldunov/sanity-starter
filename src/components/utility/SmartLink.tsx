import type { LinkProps } from 'next/link';
import Link from 'next/link';
import { resolveDestinationUrl } from '@/lib/links';
import { getTarget } from '@/lib/url';
import { cn } from '@/lib/utils';
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
	const { link, children, disabled, className, target, ...linkProps } = props;

	const fileUrl = link.file ? getSanityFileUrl(link.file).url : undefined;
	const pageUrl = resolveDestinationUrl(link.page, link.sectionId);

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
