import { ImageIcon } from 'lucide-react';
import { normalizeLineBreaks } from '@/sanity/lib/utils';
import defineImage from '@/sanity/schema/constructors/defineImage';
import defineSection from '@/sanity/schema/constructors/defineSection';

export const IMAGE_TEXT_SECTION_FRAGMENT = `
	_type == "imageTextSection" => {
		...,
		image {
			...,
			asset->,
		},
	}`;

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
				title: heading ? normalizeLineBreaks(heading) : undefined,
				subtitle: paragraph || undefined,
				media: image,
			};
		},
	},
});

export default imageTextSection;
