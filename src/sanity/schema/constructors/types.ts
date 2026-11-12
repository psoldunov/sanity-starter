import type { ComponentType, ReactElement } from 'react';
import type { FieldDefinition, ImageRule, PreviewConfig } from 'sanity';

export type DefineImageOptions = {
	title?: string;
	name?: string;
	group?: string;
	description?: string;
	validation?: (rule: ImageRule) => ImageRule;
	fields?: FieldDefinition[];
	hotspot?: boolean;
};

/**
 * Options for `defineLink`. It returns a bare `{ type }` member, so field
 * properties (`name`, `title`, `group`, …) belong on the surrounding field.
 */
export type DefineLinkOptions = {
	/** Use the `linkWithLabel` variant, which adds a label field. */
	withLabel?: boolean;
};

export type DefineSectionOptions = {
	name: string;
	title: string;
	icon?: ComponentType | ReactElement;
	fields: Array<FieldDefinition>;
	preview?: PreviewConfig;
	disablePadding?: boolean;
};
