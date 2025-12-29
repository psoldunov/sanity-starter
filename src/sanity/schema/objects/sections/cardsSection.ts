import { GridIcon } from 'lucide-react';
import { stripNonPrintables } from '@/sanity/lib/utils';
import defineImage from '../../constructors/defineImage';
import defineSection from '../../constructors/defineSection';

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
