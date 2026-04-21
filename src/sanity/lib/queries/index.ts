import { defineQuery } from 'next-sanity';
import {
	CARDS_SECTION_FRAGMENT,
	HERO_SECTION_FRAGMENT,
	IMAGE_TEXT_SECTION_FRAGMENT,
} from '@/sanity/schema/objects/sections';

export const SITE_SETTINGS_QUERY = defineQuery(`*[_type == "settings"][0]{
  ...,
  headerMenu[] {
    ...,
    page->
  },
  footerNav[] {
    ...,
    links[] {
      ...,
      page->
    }
  }
}`);

export const PAGES_QUERY = defineQuery(`*[_type == "page"]`);

export const REDIRECT_QUERY =
	defineQuery(`*[_type == "redirect" && route.current == $slug][0]{
  ...,
  destination->
}`);

export const POSTS_QUERY = defineQuery(`*[_type == "post"]`);

export const POST_QUERY =
	defineQuery(`*[_type == "post" && slug.current == $slug][0]{
  ...,
}`);

export const PAGE_QUERY =
	defineQuery(`*[_type == "page" && route.current == $slug][0]{
  ...,
  sections[] {
    ...,
    ${HERO_SECTION_FRAGMENT},
    ${CARDS_SECTION_FRAGMENT},
    ${IMAGE_TEXT_SECTION_FRAGMENT},
  }
}`);
