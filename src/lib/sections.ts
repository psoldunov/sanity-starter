import CardsSection from '@/components/sections/CardsSection';
import HeroSection from '@/components/sections/HeroSection';
import ImageTextSection from '@/components/sections/ImageTextSection';

const sections = {
	heroSection: HeroSection,
	cardsSection: CardsSection,
	imageTextSection: ImageTextSection,
};

export const dynamicSections: Array<keyof typeof sections> = [];

export default sections;
