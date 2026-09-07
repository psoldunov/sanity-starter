'use client';

import { Card, Flex, Stack, Text } from '@sanity/ui';
import { Popover } from '@sanity/ui/popover';
import { EyeOffIcon } from 'lucide-react';
import { useState } from 'react';
import type { PreviewProps } from 'sanity';
import styled from 'styled-components';
import { HIDDEN_SECTION_DESCRIPTION } from '@/sanity/constants';

const IconContainer = styled(Flex)`
	position: relative;
	flex-shrink: 0;
	flex-grow: 0;
	width: 2.0625rem;
	height: 2.0625rem;
	font-size: 1rem;
`;

const IconBorder = styled.span`
	position: absolute;
	inset: 0;
	opacity: 0.1;
	box-shadow: 0 0 0 1px var(--card-fg-color);
	border-radius: 0.0625rem;
`;

/**
 * Preview for page-builder sections. Renders the section title and subtitle, and
 * marks hidden sections with a caution tone and an eye-off badge.
 *
 * The hidden flag arrives via `description`, written by `defineSection` — see
 * `HIDDEN_SECTION_DESCRIPTION` for why it travels that way.
 *
 * @param props - Standard Sanity preview props.
 * @returns The section preview row.
 */
export default function SectionPreview(props: PreviewProps) {
	const [isHovered, setIsHovered] = useState(false);

	const title = typeof props.title === 'string' ? props.title : undefined;
	const hidden = props.description === HIDDEN_SECTION_DESCRIPTION;

	return (
		<Card tone={hidden ? 'caution' : 'default'} padding={2}>
			<Flex gap={2} align='center'>
				{hidden && (
					<Popover
						content={
							<Text size={1} muted>
								Hidden section
							</Text>
						}
						animate
						placement='top'
						padding={2}
						open={isHovered}
					>
						<IconContainer
							onMouseEnter={() => setIsHovered(true)}
							onMouseLeave={() => setIsHovered(false)}
							onFocus={() => setIsHovered(true)}
							onBlur={() => setIsHovered(false)}
							tabIndex={0}
							aria-label='Hidden section'
							align='center'
							justify='center'
							muted
						>
							<EyeOffIcon size={16} aria-hidden />
							<IconBorder />
						</IconContainer>
					</Popover>
				)}
				<Stack gap={2}>
					{!!title && (
						<Text size={1} weight='medium'>
							{title}
						</Text>
					)}
					{!!props.subtitle && (
						<Text size={1} muted textOverflow='ellipsis'>
							{props.subtitle as string}
						</Text>
					)}
				</Stack>
			</Flex>
		</Card>
	);
}
