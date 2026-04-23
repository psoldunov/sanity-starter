import type {
	PAGE_QUERY_RESULT,
	SanityImageAsset,
	SanityImageAssetReference,
	SanityImageCrop,
	SanityImageHotspot,
	SITE_SETTINGS_QUERY_RESULT,
} from '@/sanity/types/sanity.types';

type SectionUnion = NonNullable<PAGE_QUERY_RESULT>['sections'][number];

/**
 * Resolves the props for a section component by its `_type` literal.
 *
 * @template T Section `_type` from the `PAGE_QUERY_RESULT` union.
 */
export type SectionProps<T extends SectionUnion['_type']> = Extract<
	SectionUnion,
	{ _type: T }
>;

/**
 * Base fields shared by every section (injected by `defineSection()`).
 * Derived from the generated `PAGE_QUERY_RESULT` union so it stays in sync.
 */
export type SectionBaseProps = Pick<
	SectionUnion,
	'_type' | 'id' | 'hidden' | 'padding'
>;

export type {
	Page,
	Post,
	Redirect,
	Settings,
} from '@/sanity/types/sanity.types';

export type PaddingSize = 'small' | 'medium' | 'large' | 'xlarge' | 'none';

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
export type NavLinkItem = NonNullable<
	NonNullable<SITE_SETTINGS_QUERY_RESULT>['headerMenu']
>[number];

/**
 * Footer navigation column as returned by SITE_SETTINGS_QUERY.
 */
export type FooterNavColumn = NonNullable<
	NonNullable<SITE_SETTINGS_QUERY_RESULT>['footerNav']
>[number];
