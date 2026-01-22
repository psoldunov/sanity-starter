'use client';

import { Button, Flex, Label, Stack, Text } from '@sanity/ui';
import { useCallback, useMemo } from 'react';
import { type StringInputProps, set } from 'sanity';

type ListOption = { title: string; value: string };

type PaddingStringInputProps = StringInputProps & {
	schemaType: StringInputProps['schemaType'] & {
		options?: {
			list?: ListOption[];
		};
	};
};

export default function PaddingInput(props: PaddingStringInputProps) {
	const {
		value,
		onChange,
		schemaType: { options },
	} = props;

	const list = useMemo(
		() => (Array.isArray(options?.list) ? (options.list as ListOption[]) : []),
		[options?.list],
	);

	const handleClick = useCallback(
		(event: React.MouseEvent<HTMLButtonElement>) => {
			const nextValue = event.currentTarget.value;
			onChange(set(nextValue));
		},
		[onChange],
	);

	return (
		<Stack space={2}>
			{list.length === 0 ? (
				<Text size={1} muted>
					No padding options configured.
				</Text>
			) : (
				<Flex gap={2} wrap='wrap'>
					{list.map((option) => (
						<Button
							key={option.value}
							value={option.value}
							mode={value === option.value ? 'default' : 'ghost'}
							tone={value === option.value ? 'primary' : 'default'}
							onClick={handleClick}
							padding={3}
						>
							<Stack>
								<Label align='center'>{option.title}</Label>
							</Stack>
						</Button>
					))}
				</Flex>
			)}
		</Stack>
	);
}
