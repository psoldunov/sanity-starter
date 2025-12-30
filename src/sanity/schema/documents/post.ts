import { orderRankField } from '@sanity/orderable-document-list';
import { NewspaperIcon } from 'lucide-react';
import { defineType } from 'sanity';
import defineLink from '../constructors/defineLink';

const post = defineType({
	name: 'post',
	title: 'Post',
	type: 'document',
	icon: NewspaperIcon,
	fields: [
		{
			type: 'string',
			name: 'title',
			title: 'Title',
			validation: (rule) => rule.required(),
		},
		{
			type: 'slug',
			name: 'slug',
			title: 'Slug',
			options: {
				source: 'title',
			},
			validation: (rule) => rule.required(),
		},
		defineLink({
			name: 'smartLink',
			withLabel: true,
		}),
		{
			name: 'links',
			type: 'array',
			title: 'Links',
			of: [defineLink({})],
		},
		{
			type: 'array',
			name: 'content',
			title: 'Content',
			of: [
				{
					type: 'block',
				},
			],
			validation: (rule) => rule.required(),
		},
		orderRankField({ type: 'post' }),
	],
});

export default post;
