import cardsSection, { CARDS_SECTION_FRAGMENT } from './cardsSection';
import heroSection, { HERO_SECTION_FRAGMENT } from './heroSection';
import imageTextSection, {
	IMAGE_TEXT_SECTION_FRAGMENT,
} from './imageTextSection';

export {
	CARDS_SECTION_FRAGMENT,
	HERO_SECTION_FRAGMENT,
	IMAGE_TEXT_SECTION_FRAGMENT,
};

const sectionTypes = [heroSection, cardsSection, imageTextSection];

export default sectionTypes;
