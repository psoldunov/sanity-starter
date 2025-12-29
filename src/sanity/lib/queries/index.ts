import { defineQuery } from 'next-sanity';
import { SECTIONS_FRAGMENTS } from './fragments';

export const SITE_SETTINGS_QUERY = defineQuery(`*[_type == "settings"][0]{
  ...,
}`);

export const PAGES_QUERY = defineQuery(`*[_type == "page"]`);

export const REDIRECT_QUERY =
	defineQuery(`*[_type == "redirect" && route.current == $slug][0]{
  ...,
  destination->
}`);

export const PAGE_QUERY =
	defineQuery(`*[_type == "page" && route.current == $slug][0]{
  ...,
  sections[] {
    ...,
    ${SECTIONS_FRAGMENTS.join(',\n')},
  }
}`);
