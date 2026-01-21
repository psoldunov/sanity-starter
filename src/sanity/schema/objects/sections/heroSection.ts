import { MonitorIcon } from 'lucide-react';
import { groq } from 'next-sanity';
import { getImageFragment } from '@/sanity/lib/queries/helpers';
import { stripNonPrintables } from '@/sanity/lib/utils';
import defineImage from '@/sanity/schema/constructors/defineImage';
import defineSection from '@/sanity/schema/constructors/defineSection';
import type { BaseSectionProps, SmartImageObject } from '@/types';

export const HERO_SECTION_FRAGMENT = groq`
	_type == "heroSection" => {
		...,
		${getImageFragment('image')}
	}`;

export type HeroSectionProps = BaseSectionProps & {
	_type: 'heroSection';
	heading: string;
	paragraph: string;
	image: SmartImageObject;
};

const heroSection = defineSection({
	name: 'heroSection',
	title: 'Hero Section',
	icon: MonitorIcon,
	fields: [
		{
			type: 'string',
			name: 'heading',
			title: 'Heading',
			validation: (rule) => rule.required(),
		},
		{
			name: 'paragraph',
			type: 'text',
			title: 'Paragraph',
			validation: (rule) => rule.required(),
		},
		defineImage({
			title: 'Image',
			validation: (rule) => rule.required(),
			hotspot: true,
		}),
	],
	preview: {
		select: {
			heading: 'heading',
			paragraph: 'paragraph',
			media: 'image',
		},
		prepare({ heading, paragraph, media }) {
			return {
				title: heading ? stripNonPrintables(heading) : undefined,
				subtitle: paragraph ? paragraph : undefined,
				media: media,
			};
		},
	},
});

export default heroSection;
