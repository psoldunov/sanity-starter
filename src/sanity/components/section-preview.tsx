'use client';

import { Card, Flex, Popover, Stack, Text } from '@sanity/ui';
import { EyeOffIcon } from 'lucide-react';
import { useState } from 'react';
import type { PreviewProps } from 'sanity';
import styled from 'styled-components';

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

export default function SectionPreview(props: PreviewProps) {
	const [isHovered, setIsHovered] = useState(false);

	try {
		const { title, hidden } = JSON.parse(props.title as string);

		return (
			<Card tone={hidden ? 'caution' : 'default'} padding={2}>
				<Flex gap={2} align='center'>
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
							align='center'
							justify='center'
							muted
						>
							<EyeOffIcon size={16} />
							<IconBorder />
						</IconContainer>
					</Popover>
					<Stack space={2}>
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
	} catch {
		return <>{props.renderDefault(props)}</>;
	}
}
