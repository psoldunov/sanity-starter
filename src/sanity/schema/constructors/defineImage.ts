import { defineField, type FieldDefinition, type ImageRule } from 'sanity';

/**
 * Defines a Sanity image field with common configuration.
 * Automatically configures image formats, hotspot, and blurhash metadata.
 * Optionally includes an alt text field for accessibility.
 *
 * @param title - Display title for the image field (default: 'Image')
 * @param name - Field name/identifier (default: 'image')
 * @param validation - Optional validation rule function for the image field
 * @param fields - Optional additional fields to include with the image
 * @param hotspot - Whether to include the hotspot field (default: false)
 * @returns A Sanity field definition for an image type
 */
export default function defineImage({
	title = 'Image',
	name = 'image',
	validation,
	fields,
	hotspot = false,
}: {
	title?: string;
	name?: string;
	validation?: (rule: ImageRule) => ImageRule;
	fields?: FieldDefinition[];
	hotspot?: boolean;
}) {
	return defineField({
		name,
		type: 'image',
		title,
		validation,
		options: {
			accept: 'image/webp, image/png, image/jpeg, image/avif',
			metadata: ['blurhash'],
			hotspot,
		},
		fields: [...(fields || [])],
	});
}
