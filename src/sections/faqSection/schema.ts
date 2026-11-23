import { CircleHelpIcon } from 'lucide-react';
import { normalizeLineBreaks } from '@/sanity/lib/utils';
import defineSection from '@/sanity/schema/constructors/defineSection';

/**
 * Questions and answers. Besides rendering them, the page's JSON-LD turns a
 * visible FAQ section into an `FAQPage`, so search engines and AI agents read
 * the answers as answers (`buildPageJsonLd` in `src/lib/structuredData.ts`).
 */
const faqSection = defineSection({
	name: 'faqSection',
	title: 'FAQ Section',
	icon: CircleHelpIcon,
	fields: [
		{
			type: 'string',
			name: 'heading',
			title: 'Heading',
			description: 'Shown above the questions.',
			initialValue: 'Frequently asked questions',
			validation: (rule) => rule.required(),
		},
		{
			type: 'array',
			name: 'items',
			title: 'Questions',
			description:
				'Shown in this order. Each opens on click to show its answer.',
			validation: (rule) => rule.required().min(1),
			of: [
				{
					type: 'object',
					name: 'faqItem',
					title: 'Question',
					fields: [
						{
							type: 'string',
							name: 'question',
							title: 'Question',
							description: 'The question as a visitor would ask it.',
							validation: (rule) => rule.required(),
						},
						{
							type: 'text',
							name: 'answer',
							title: 'Answer',
							description:
								'Plain text. Each new line starts a new line on the page.',
							rows: 4,
							validation: (rule) => rule.required(),
						},
					],
					preview: {
						select: { title: 'question', subtitle: 'answer' },
					},
				},
			],
		},
	],
	preview: {
		select: {
			heading: 'heading',
			items: 'items',
		},
		prepare({ heading, items }) {
			const count = Array.isArray(items) ? items.length : 0;
			return {
				title: heading ? normalizeLineBreaks(heading) : undefined,
				subtitle: `${count} ${count === 1 ? 'question' : 'questions'}`,
			};
		},
	},
});

export default faqSection;
