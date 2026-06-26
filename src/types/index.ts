import type {
	LinkWithLabel,
	PAGE_QUERY_RESULT,
	REDIRECT_QUERY_RESULT,
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

export type DefineLinkOptions = {
	withLabel?: boolean;
};

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
 * A linkable Sanity document type (besides `page`) registered in
 * `LINKABLE_DOCUMENTS`. Drives the Studio destination picker, the
 * `internalDestination` reference targets and URL resolution.
 */
export type LinkableDocument = {
	/** Sanity `_type` of the document. */
	type: string;
	/** Human label shown in the Studio picker and badges. */
	label: string;
	/** URL prefix the document's slug resolves under, e.g. `/posts`. */
	basePath: string;
	/** Field path used as the option title in the picker, e.g. `title`. */
	titleField: string;
	/** Field path to the slug string, e.g. `slug.current`. */
	slugField: string;
};

/**
 * A static Next route (no backing Sanity document) selectable as a destination.
 */
export type StaticRoute = {
	/** Human label shown in the picker. */
	label: string;
	/** Absolute app path, e.g. `/contact`. */
	path: string;
};

/**
 * Stored value of an `internalDestination` object in the Studio: either a
 * document `reference` or a `staticPath`. Written by the destination picker and
 * read by schema validation. Fields are optional to cover the partially-filled
 * states the picker passes through.
 */
export type InternalDestinationValue = {
	_type?: 'internalDestination';
	reference?: { _type?: 'reference'; _ref?: string };
	staticPath?: string;
};

/**
 * A resolved internal destination — either a static Next route or a linkable
 * document reference dereferenced to its URL-building fields.
 *
 * Derived from the generated `REDIRECT_QUERY_RESULT`, whose `destination` is
 * projected with the shared `INTERNAL_DESTINATION_PROJECTION`. The same shape is
 * produced wherever a link's `page`/`destination` is queried, so this tracks the
 * GROQ projection automatically instead of being hand-maintained.
 */
export type ResolvedDestination =
	NonNullable<REDIRECT_QUERY_RESULT>['destination'];

/**
 * Link with label (labelled variant of the registered `link` schema type)
 * with the `page` destination dereferenced for URL resolution.
 */
export type SmartLinkProps = Omit<LinkWithLabel, 'page'> & {
	_key?: string;
	page?: ResolvedDestination;
};

/**
 * Footer navigation column as returned by SITE_SETTINGS_QUERY.
 */
export type FooterNavColumn = NonNullable<
	NonNullable<SITE_SETTINGS_QUERY_RESULT>['footerNav']
>[number];
