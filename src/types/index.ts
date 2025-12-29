import type { SanityImageSource } from '@sanity/asset-utils';
import type { SanityReference } from 'next-sanity';
import type { ImageAsset, ImageCrop, ImageHotspot, Slug } from 'sanity';
import type { SectionProps } from './sections';

export type BaseSectionProps = {
	_type: string;
	_key: string;
	searchParams?: { [key: string]: string | string[] | undefined };
	id?: string;
	hidden?: boolean;
	padding?: {
		top?: string;
		bottom?: string;
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
