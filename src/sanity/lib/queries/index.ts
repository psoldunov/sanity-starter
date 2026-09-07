import { defineQuery } from 'next-sanity';
import {
	CARDS_SECTION_FRAGMENT,
	HERO_SECTION_FRAGMENT,
	IMAGE_TEXT_SECTION_FRAGMENT,
	INTERNAL_DESTINATION_PROJECTION,
} from '@/sanity/lib/fragments';

/**
 * Every query below projects only the fields its call site actually reads.
 *
 * That is deliberate and it is the single biggest performance lever in this
 * starter: an unprojected `*[_type == "page"]` returns every field of every
 * page — including the whole section tree and every image object — to a sitemap
 * that needs two strings. Keep new queries projected.
 */

/** Site-wide settings: header, footer and the SEO defaults every page inherits. */
export const SITE_SETTINGS_QUERY = defineQuery(`*[_type == "settings"][0]{
  siteName,
  siteDescription,
  siteOgImage,
  logo {
    ...,
    asset->
  },
  headerMenu[] {
    ...,
    page ${INTERNAL_DESTINATION_PROJECTION}
  },
  footerNav[] {
    ...,
    links[] {
      ...,
      page ${INTERNAL_DESTINATION_PROJECTION}
    }
  }
}`);

/** Routes of every page, for `generateStaticParams`. Two fields, not the tree. */
export const PAGE_ROUTES_QUERY = defineQuery(
	`*[_type == "page" && defined(route.current)]{ "route": route.current }`,
);

/** Indexable pages for `sitemap.ts`. Excludes anything flagged `noIndex`. */
export const PAGES_SITEMAP_QUERY = defineQuery(
	`*[_type == "page" && defined(route.current) && noIndex != true] | order(route.current asc){
  "route": route.current,
  _updatedAt
}`,
);

/** A single page with its section tree, for the catch-all route. */
export const PAGE_QUERY =
	defineQuery(`*[_type == "page" && route.current == $slug][0]{
  _id,
  title,
  "route": route.current,
  metaTitle,
  metaDescription,
  noIndex,
  ogImage,
  sections[] {
    ...,
    ${HERO_SECTION_FRAGMENT},
    ${CARDS_SECTION_FRAGMENT},
    ${IMAGE_TEXT_SECTION_FRAGMENT}
  }
}`);

/** Redirect lookup, used when no page matches a route. */
export const REDIRECT_QUERY =
	defineQuery(`*[_type == "redirect" && route.current == $slug][0]{
  destination ${INTERNAL_DESTINATION_PROJECTION}
}`);

/** Slugs of every post, for `generateStaticParams`. */
export const POST_SLUGS_QUERY = defineQuery(
	`*[_type == "post" && defined(slug.current)]{ "slug": slug.current }`,
);

/** Indexable posts for `sitemap.ts`. */
export const POSTS_SITEMAP_QUERY = defineQuery(
	`*[_type == "post" && defined(slug.current) && noIndex != true] | order(coalesce(publishedAt, _createdAt) desc){
  "slug": slug.current,
  _updatedAt
}`,
);

/**
 * One page of the blog index, newest first. `$start`/`$end` are a GROQ slice, so
 * the Content Lake does the paging rather than the app slicing a full list.
 */
export const POSTS_PAGE_QUERY =
	defineQuery(`*[_type == "post" && defined(slug.current)] | order(coalesce(publishedAt, _createdAt) desc)[$start...$end]{
  _id,
  title,
  "slug": slug.current,
  excerpt,
  "publishedAt": coalesce(publishedAt, _createdAt),
  coverImage {
    ...,
    asset->
  }
}`);

/** Total post count, for pagination controls. */
export const POSTS_COUNT_QUERY = defineQuery(
	`count(*[_type == "post" && defined(slug.current)])`,
);

/** A single post with its body, for the article template. */
export const POST_QUERY =
	defineQuery(`*[_type == "post" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  excerpt,
  "publishedAt": coalesce(publishedAt, _createdAt),
  metaTitle,
  metaDescription,
  noIndex,
  ogImage,
  coverImage {
    ...,
    asset->
  },
  content[] {
    ...,
    _type == "contentImage" => {
      ...,
      asset->
    }
  }
}`);

/** Sibling posts shown under an article, excluding the article itself. */
export const RELATED_POSTS_QUERY =
	defineQuery(`*[_type == "post" && defined(slug.current) && slug.current != $slug] | order(coalesce(publishedAt, _createdAt) desc)[0...3]{
  _id,
  title,
  "slug": slug.current,
  excerpt,
  "publishedAt": coalesce(publishedAt, _createdAt),
  coverImage {
    ...,
    asset->
  }
}`);
