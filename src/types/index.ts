import type { SanityReference } from 'next-sanity';
import type {
	ImageAsset,
	ImageCrop,
	ImageHotspot,
	Reference,
	Slug,
} from 'sanity';

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
	asset: SanityReference | ImageAsset;
	alt?: string;
	caption?: string;
	crop?: ImageCrop;
	hotspot?: ImageHotspot;
};

export type Settings = {
	_type: 'settings';
	_id: string;
	_createdAt: string;
	_updatedAt: string;
	siteName: string;
	siteDescription: string;
	siteOgImage: SmartImageObject;
};

export type Page = {
	_type: 'page';
	_id: string;
	_createdAt: string;
	_updatedAt: string;
	title: string;
	route: Slug;
	sections: unknown[]; // TODO: Add section type
	metaTitle?: string;
	metaDescription?: string;
	ogImage?: Reference; // TODO: Add image type
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
