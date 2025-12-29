import { ImageIcon } from 'lucide-react';
import { stripNonPrintables } from '@/sanity/lib/utils';
import defineImage from '../../constructors/defineImage';
import defineSection from '../../constructors/defineSection';

const imageTextSection = defineSection({
	name: 'imageTextSection',
	title: 'Image Text Section',
	icon: ImageIcon,
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
	preview: {
		select: {
			heading: 'heading',
			paragraph: 'paragraph',
			image: 'image',
		},
		prepare({ heading, paragraph, image }) {
			return {
				title: heading ? stripNonPrintables(heading) : undefined,
				subtitle: paragraph || undefined,
				media: image,
			};
		},
	},
});

export default imageTextSection;
