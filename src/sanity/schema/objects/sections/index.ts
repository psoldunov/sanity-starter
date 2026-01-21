import cardsSection, {
	CARDS_SECTION_FRAGMENT,
	type CardsSectionProps,
} from './cardsSection';
import heroSection, {
	HERO_SECTION_FRAGMENT,
	type HeroSectionProps,
} from './heroSection';
import imageTextSection, {
	IMAGE_TEXT_SECTION_FRAGMENT,
	type ImageTextSectionProps,
} from './imageTextSection';

export const SECTIONS_FRAGMENTS = [
	HERO_SECTION_FRAGMENT,
	CARDS_SECTION_FRAGMENT,
	IMAGE_TEXT_SECTION_FRAGMENT,
];

const sectionTypes = [heroSection, cardsSection, imageTextSection];

export type SectionProps =
	| HeroSectionProps
	| CardsSectionProps
	| ImageTextSectionProps;

export default sectionTypes;
