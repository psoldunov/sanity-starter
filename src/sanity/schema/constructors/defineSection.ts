import type { ComponentType, ReactElement } from 'react';
import { defineType, type FieldDefinition, type PreviewConfig } from 'sanity';
import { PADDING_CONFIG } from '@/config';
import PaddingInput from '@/sanity/components/padding-input';
import SectionPreview from '@/sanity/components/section-preview';
import type { PaddingSize } from '@/types';

export const PADDING_OPTIONS = Object.entries(PADDING_CONFIG).map(
	([value, config]) => ({
		value: value as PaddingSize,
		label: config.label,
	}),
) as Array<{ value: PaddingSize; label: string }>;

/**
 * Defines a Sanity section schema with common fields.
 * Automatically adds `sectionId` and `hidden` fields to all sections.
 *
 * @param name - The unique name/identifier for the section type
 * @param title - The display title for the section
 * @param icon - Optional React component or element to use as the section icon
 * @param fields - Array of field definitions specific to this section
 * @param preview - Preview configuration for how the section appears in the studio
 * @returns A Sanity type definition for the section
 */
export default function defineSection({
	name,
	title,
	icon,
	fields,
	preview,
}: {
	name: string;
	title: string;
	icon?: ComponentType | ReactElement;
	fields: Array<FieldDefinition>;
	preview?: PreviewConfig;
}) {
	return defineType({
		name,
		type: 'object',
		title,
		icon,
		components: {
			preview: SectionPreview,
		},
		groups: [
			{
				name: 'content',
				title: 'Content',
				default: true,
			},
			{
				name: 'configuration',
				title: 'Configuration',
			},
		],
		fields: [
			...(fields.map((field) => ({
				...field,
				group: 'content',
			})) || []),
			{
				type: 'object',
				name: 'padding',
				title: 'Padding',
				group: 'configuration',

				fields: [
					{
						type: 'string',
						name: 'top',
						title: 'Top',
						initialValue: 'small',
						components: {
							input: PaddingInput,
						},
						options: {
							layout: 'select',
							list: PADDING_OPTIONS.map(({ label, value }) => ({
								title: label,
								value,
							})),
						},
					},
					{
						type: 'string',
						name: 'bottom',
						title: 'Bottom',
						initialValue: 'small',
						components: {
							input: PaddingInput,
						},
						options: {
							layout: 'select',
							list: PADDING_OPTIONS.map(({ label, value }) => ({
								title: label,
								value,
							})),
						},
					},
				],
				validation: (rule) => rule.required(),
			},
			{
				type: 'string',
				name: 'id',
				title: 'ID',
				group: 'configuration',
				description: 'The ID of the section for internal linking (optional)',
				validation: (rule) => rule.optional(),
			},
			{
				type: 'boolean',
				name: 'hidden',
				title: 'Hidden',
				group: 'configuration',
				description:
					'Prevents the section from being displayed in the frontend',
				initialValue: false,
			},
		],
		preview: {
			select: {
				...preview?.select,
				hidden: 'hidden',
			},
			prepare: (...args) => {
				const prepared = preview?.prepare?.(...args) || {};
				return {
					...prepared,
					title: args[0].hidden
						? JSON.stringify({ title: prepared.title, hidden: true })
						: prepared.title,
				};
			},
		},
	});
}
