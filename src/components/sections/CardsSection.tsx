import Container from '@/components/layout/Container';
import Section from '@/components/utility/Section';
import SmartImage from '@/components/utility/SmartImage';
import type { SectionProps } from '@/types';

export default function CardsSection(props: SectionProps<'cardsSection'>) {
	const { heading, cards } = props;

	return (
		<Section {...props}>
			<Container>
				{!!heading && (
					<h2 className='mb-12 text-balance text-center font-semibold text-3xl text-foreground tracking-tight sm:text-4xl'>
						{heading}
					</h2>
				)}
				<div className='grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3'>
					{cards?.map((card) => (
						<div
							key={card._key}
							className='flex flex-col rounded-theme border border-border bg-surface p-6'
						>
							{!!card.image && (
								<SmartImage
									image={card.image}
									// Explicit dimensions: without them SmartImage requests the
									// asset's intrinsic size, so a 2000px upload was downloaded
									// in full to fill a 64px box.
									width={64}
									height={64}
									sizes='64px'
									className='mb-4 h-16 w-16 rounded-theme object-cover'
								/>
							)}
							{!!card.heading && (
								<h3 className='mb-2 font-semibold text-foreground text-lg'>
									{card.heading}
								</h3>
							)}
							{!!card.paragraph && (
								<p className='text-muted text-sm/6'>{card.paragraph}</p>
							)}
						</div>
					))}
				</div>
			</Container>
		</Section>
	);
}
