import type { StegaBranded } from 'next-sanity';
import type {
	PAGE_QUERY_RESULT,
	POSTS_PAGE_QUERY_RESULT,
	REDIRECT_QUERY_RESULT,
	SanityFileAssetReference,
	SanityImageAsset,
	SanityImageAssetReference,
	SanityImageCrop,
	SanityImageHotspot,
	SITE_SETTINGS_QUERY_RESULT,
} from '@/sanity/types/sanity.types';

/**
 * Data as it arrives from `sanityFetch`.
 *
 * `sanityFetch` deep-brands string properties as `StegaString`, because in draft
 * mode they may carry invisible click-to-edit characters. `StegaString<T>` is a
 * template-literal subtype of `string`, so ordinary string fields still flow
 * through unchanged — but a field typed as a *literal union* (`rel`,
 * `padding.top`) is no longer assignable to that union once branded.
 *
 * Component props therefore derive from the branded result rather than the raw
 * TypeGen output, so the types match what a component is actually handed.
 */
type Fetched<T> = StegaBranded<NonNullable<T>>;

type SectionUnion = Fetched<PAGE_QUERY_RESULT>['sections'][number];

/** One section as handed to `SectionRenderer` by the catch-all page. */
export type SectionData = SectionUnion;

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

/**
 * Document types re-exported as a stable import path.
 *
 * `@/sanity/types/sanity.types` is generated and gitignored, so importing it
 * directly couples application code to a build artefact. These aliases are
 * deliberate public surface for anyone building on the starter — they are not
 * dead code, even when nothing in the template consumes them.
 */
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
	_type?: string;
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
	/**
	 * Marks the image as purely decorative, which is the only case where an
	 * empty `alt` is correct. Without it, a missing alt is a content bug and
	 * SmartImage says so in development.
	 */
	decorative?: boolean;
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
 * Anything link-shaped that `SmartLink` can resolve.
 *
 * Written by hand rather than derived from `LinkWithLabel` so the component
 * accepts a hand-built link (`{ href: '/' }` for a logo) as readily as a queried
 * one, and so `rel` stays a plain `string` — the generated literal union does
 * not survive stega branding.
 */
export type SmartLinkProps = {
	_key?: string;
	_type?: string;
	label?: string | null;
	page?: ResolvedDestination | null;
	sectionId?: string | null;
	href?: string | null;
	rel?: string | null;
	file?: {
		_type?: 'file';
		asset?: SanityFileAssetReference | null;
	} | null;
};

/** Site settings as returned by SITE_SETTINGS_QUERY through `sanityFetch`. */
export type SiteSettings = Fetched<SITE_SETTINGS_QUERY_RESULT>;

/**
 * Header menu link item as returned by SITE_SETTINGS_QUERY with the page
 * reference dereferenced.
 */
export type NavLinkItem = NonNullable<SiteSettings['headerMenu']>[number];

/**
 * Footer navigation column as returned by SITE_SETTINGS_QUERY.
 */
export type FooterNavColumn = NonNullable<SiteSettings['footerNav']>[number];

/** A post as projected for listing cards on the blog index. */
export type PostListItem = StegaBranded<POSTS_PAGE_QUERY_RESULT>[number];

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
