import Container from '@/components/layout/Container';
import type { CardsSectionProps } from '@/types/sections';
import SmartImage from '../utility/SmartImage';

export default function CardsSection(props: CardsSectionProps) {
	const { heading, cards } = props;

	return (
		<section className='bg-background py-20'>
			<Container>
				{!!heading && (
					<h2 className='mb-12 text-center font-bold text-4xl text-foreground'>
						{heading}
					</h2>
				)}
				<div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
					{cards.map((card) => (
						<div
							key={card._key}
							className='rounded-lg border border-foreground/10 bg-background p-4 py-6'
						>
							{!!card.image && (
								<SmartImage
									image={card.image}
									className='mb-4 h-16 w-16 rounded-lg'
								/>
							)}
							{!!card.heading && (
								<h3 className='mb-3 font-semibold text-2xl text-foreground'>
									{card.heading}
								</h3>
							)}
							{!!card.paragraph && (
								<p className='text-foreground/70'>{card.paragraph}</p>
							)}
						</div>
					))}
				</div>
			</Container>
		</section>
	);
}
