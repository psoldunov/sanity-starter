import type { ComponentType, ReactElement } from 'react';
import type { FieldDefinition, ImageRule, PreviewConfig } from 'sanity';
import type {
	SanityImageAsset,
	SanityImageAssetReference,
	SanityImageCrop,
	SanityImageHotspot,
	SITE_SETTINGS_QUERY_RESULT,
} from '@/sanity/types/sanity.types';

export type {
	Page,
	Post,
	Redirect,
	Settings,
} from '@/sanity/types/sanity.types';

export type PaddingSize = 'small' | 'medium' | 'large' | 'xlarge' | 'none';

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

export type BaseSectionProps = {
	_type: string;
	_key: string;
	searchParams?: { [key: string]: string | string[] | undefined };
	id?: string;
	hidden?: boolean;
	padding?: {
		top?: PaddingSize;
		bottom?: PaddingSize;
	};
};

/**
 * Sanity image shape accepted by SmartImage. Covers both referenced
 * (`asset->` not applied) and dereferenced forms. `altText` on the
 * dereferenced asset is populated by `sanity-plugin-media`.
 */
export type SmartImageObject = {
	asset?: SanityImageAssetReference | SanityImageAsset | null;
	caption?: string;
	crop?: SanityImageCrop | null;
	hotspot?: SanityImageHotspot | null;
	_type?: 'image';
	media?: unknown;
};

export type SmartImageProps = {
	image: SmartImageObject;
	width?: number;
	height?: number;
	className?: string;
	quality?: number;
	priority?: boolean;
	fill?: boolean;
	sizes?: string;
	alt?: string;
};

/**
 * Header menu link item as returned by SITE_SETTINGS_QUERY with the page
 * reference dereferenced.
 */
export type SmartLinkProps = NonNullable<
	NonNullable<SITE_SETTINGS_QUERY_RESULT>['headerMenu']
>[number];
