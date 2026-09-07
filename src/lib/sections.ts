import CardsSection from '@/components/sections/CardsSection';
import HeroSection from '@/components/sections/HeroSection';
import ImageTextSection from '@/components/sections/ImageTextSection';

/**
 * Section registry. Keys must match the schema `_type` exactly — `SectionRenderer`
 * looks components up by the `_type` that comes back from `PAGE_QUERY`.
 */
const sections = {
	heroSection: HeroSection,
	cardsSection: CardsSection,
	imageTextSection: ImageTextSection,
};

export default sections;
