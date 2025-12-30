import { MonitorIcon } from 'lucide-react';
import { stripNonPrintables } from '@/sanity/lib/utils';
import defineImage from '@/sanity/schema/constructors/defineImage';
import defineSection from '@/sanity/schema/constructors/defineSection';

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
