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

export type DefineLinkOptions = {
	withLabel?: boolean;
	name?: string;
	title?: string;
	description?: string;
	group?: string;
};

export type DefineSectionOptions = {
	name: string;
	title: string;
	icon?: ComponentType | ReactElement;
	fields: Array<FieldDefinition>;
	preview?: PreviewConfig;
	disablePadding?: boolean;
};
