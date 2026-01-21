import { GridIcon } from 'lucide-react';
import { groq } from 'next-sanity';
import { getImageFragment } from '@/sanity/lib/queries/helpers';
import { stripNonPrintables } from '@/sanity/lib/utils';
import type { BaseSectionProps, SmartImageObject } from '@/types';
import defineImage from '../../constructors/defineImage';
import defineSection from '../../constructors/defineSection';

export const CARDS_SECTION_FRAGMENT = groq`
	_type == "cardsSection" => {
		...,
		cards[] {
			...,
			${getImageFragment('image')}
		}
	}`;

export type CardsSectionProps = BaseSectionProps & {
	_type: 'cardsSection';
	heading: string;
	cards: {
		_key: string;
		heading: string;
		paragraph: string;
		image: SmartImageObject;
	}[];
};

const cardsSection = defineSection({
	name: 'cardsSection',
	title: 'Cards Section',
	icon: GridIcon,
	fields: [
		{
			type: 'string',
			name: 'heading',
			title: 'Heading',
			validation: (rule) => rule.required(),
		},
		{
			type: 'array',
			name: 'cards',
			title: 'Cards',
			of: [
				{
					type: 'object',
					name: 'card',
					title: 'Card',
					fields: [
						{
							type: 'string',
							name: 'heading',
							title: 'Heading',
							validation: (rule) => rule.required(),
						},
						{
							type: 'text',
							name: 'paragraph',
							title: 'Paragraph',
							validation: (rule) => rule.required(),
						},
						defineImage({
							title: 'Image',
							validation: (rule) => rule.required(),
							hotspot: true,
						}),
					],
				},
			],
		},
	],
	preview: {
		select: {
			heading: 'heading',
			cards: 'cards',
		},
		prepare({ heading, cards }) {
			return {
				title: heading ? stripNonPrintables(heading) : undefined,
				subtitle: cards ? `${cards.length} cards` : undefined,
			};
		},
	},
});

export default cardsSection;
