import type { PortableTextBlock } from 'next-sanity';
import type { BaseSectionProps, SmartImageObject } from '.';

export type SectionProps =
	| HeroSectionProps
	| CardsSectionProps
	| ImageTextSectionProps;

export type HeroSectionProps = BaseSectionProps & {
	_type: 'heroSection';
	heading: string;
	paragraph: PortableTextBlock[];
	image: SmartImageObject;
};

export type CardsSectionProps = BaseSectionProps & {
	_type: 'cardsSection';
	heading: string;
	cards: {
		_key: string;
		heading: string;
		paragraph: string;
		image: SmartImageObject;
	}[];
};

export type ImageTextSectionProps = BaseSectionProps & {
	_type: 'imageTextSection';
	heading: string;
	paragraph: string;
	image: SmartImageObject;
};
