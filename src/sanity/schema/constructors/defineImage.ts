import { defineField } from 'sanity';
import type { DefineImageOptions } from '@/types';

/**
 * Defines a Sanity image field with common configuration.
 * Automatically configures image formats, hotspot, and blurhash metadata.
 * Optionally includes an alt text field for accessibility.
 *
 * @param options - Configuration for the image field
 * @param options.title - Display title (default: 'Image')
 * @param options.name - Field name/identifier (default: 'image')
 * @param options.group - Optional field group to assign the image to
 * @param options.description - Optional description for the image field
 * @param options.validation - Optional validation rule function for the image field
 * @param options.fields - Optional additional fields to include with the image
 * @param options.hotspot - Whether to include the hotspot field (default: false)
 * @returns A Sanity field definition for an image type
 */
export default function defineImage(options: DefineImageOptions = {}) {
	const {
		title = 'Image',
		name = 'image',
		validation,
		description,
		fields,
		group,
		hotspot = false,
	} = options;

	return defineField({
		name,
		type: 'image',
		title,
		group,
		description,
		validation,
		options: {
			accept: 'image/webp, image/png, image/jpeg, image/avif',
			metadata: ['blurhash'],
			hotspot,
		},
		fields: [...(fields || [])],
	});
}
