import { groq } from 'next-sanity';
import { getImageFragment } from './helpers';

const HERO_SECTION_FRAGMENT = groq`
	_type == "heroSection" => {
		...,
		${getImageFragment('image')}
	}`;

const CARDS_SECTION_FRAGMENT = groq`
	_type == "cardsSection" => {
		...,
		cards[] {
			...,
			${getImageFragment('image')}
		}
	}`;

const IMAGE_TEXT_SECTION_FRAGMENT = groq`
	_type == "imageTextSection" => {
		...,
		${getImageFragment('image')}
	}`;

export const SECTIONS_FRAGMENTS = [
	HERO_SECTION_FRAGMENT,
	CARDS_SECTION_FRAGMENT,
	IMAGE_TEXT_SECTION_FRAGMENT,
];
