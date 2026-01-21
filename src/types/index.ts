import type { SanityFileSource, SanityImageSource } from '@sanity/asset-utils';
import type { SanityReference } from 'next-sanity';
import type { ComponentType, ReactElement } from 'react';
import type {
	FieldDefinition,
	ImageAsset,
	ImageCrop,
	ImageHotspot,
	ImageRule,
	PortableTextBlock,
	PreviewConfig,
	Slug,
} from 'sanity';
import type { SectionProps } from '@/sanity/schema/objects/sections';

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

export type SmartImageObject = {
	asset:
		| SanityReference
		| (ImageAsset & {
				altText?: string;
				title?: string;
				description?: string;
		  });
	caption?: string;
	crop?: ImageCrop;
	hotspot?: ImageHotspot;
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
};

export type Settings = {
	_type: 'settings';
	_id: string;
	_createdAt: string;
	_updatedAt: string;
	siteName?: string;
	siteDescription?: string;
	headerMenu?: SmartLinkProps[];
	siteOgImage?: SanityImageSource;
};

export type Page = {
	_type: 'page';
	_id: string;
	_createdAt: string;
	_updatedAt: string;
	title: string;
	route: Slug;
	sections: SectionProps[];
	metaTitle?: string;
	metaDescription?: string;
	ogImage?: SanityImageSource;
	noIndex: boolean;
};

export type Redirect = {
	_type: 'redirect';
	_id: string;
	_createdAt: string;
	_updatedAt: string;
	route: Slug;
	destination: Page;
};

export type Post = {
	_type: 'post';
	_id: string;
	_createdAt: string;
	_updatedAt: string;
	title: string;
	slug: Slug;
	content: PortableTextBlock[];
};

export type SmartLinkProps = {
	_type: string;
	_key?: string;
	label?: string;
	page?: Page;
	sectionId?: string;
	href?: string;
	rel?: 'noopener' | 'noopener noreferrer';
	file?: SanityFileSource;
};
