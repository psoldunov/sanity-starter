import { BotIcon } from 'lucide-react';
import { defineField, defineType } from 'sanity';
import { PAGE_SCHEMA_TYPES } from '@/config/llm';

/**
 * Per-document controls for the LLM layer: how a page or post appears to AI
 * agents in `/llms.txt`, and what kind of page its JSON-LD declares.
 *
 * Search visibility stays with `noIndex`, which wins over everything here: a
 * hidden document gets no markdown and no index entry whatever this says. That
 * is why both documents hide this field while `noIndex` is on.
 */
export const geo = defineType({
	name: 'geo',
	title: 'AI & LLM visibility',
	type: 'object',
	icon: BotIcon,
	options: { collapsible: false },
	fields: [
		defineField({
			name: 'llmsListing',
			title: 'Listing in llms.txt',
			description:
				'How this appears in /llms.txt. "Optional" puts it in the section agents may skip when short on context. "Not listed" leaves it out of the index files; its markdown copy is still served.',
			type: 'string',
			options: {
				list: [
					{ title: 'Listed', value: 'listed' },
					{ title: 'Optional', value: 'optional' },
					{ title: 'Not listed', value: 'unlisted' },
				],
				layout: 'radio',
				direction: 'horizontal',
			},
			initialValue: 'listed',
		}),
		defineField({
			name: 'llmsSummary',
			title: 'Summary for AI agents',
			description:
				'One or two plain sentences on what this page answers. Used in /llms.txt and the markdown copy instead of the meta description.',
			type: 'text',
			rows: 3,
			validation: (rule) =>
				rule.max(300).warning('Keep it short: agents read it in a list.'),
		}),
		defineField({
			name: 'schemaType',
			title: 'Page type',
			description:
				'The schema.org type this page declares to search engines and agents.',
			type: 'string',
			options: { list: [...PAGE_SCHEMA_TYPES], layout: 'dropdown' },
			initialValue: 'WebPage',
			// A post is always an article; the type is the page builder's choice.
			hidden: ({ document }) => document?._type !== 'page',
		}),
	],
});
