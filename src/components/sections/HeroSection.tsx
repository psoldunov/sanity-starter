import Container from '@/components/layout/Container';
import Section from '@/components/utility/Section';
import SmartImage from '@/components/utility/SmartImage';
import type { SectionProps } from '@/types';

export default function HeroSection(props: SectionProps<'heroSection'>) {
	const { heading, paragraph, image } = props;

	return (
		<Section {...props}>
			<Container>
				<div className='flex items-center'>
					<div className='grid grid-cols-1 items-center gap-12 md:grid-cols-2'>
						<div className='text-foreground'>
							{!!heading && (
								<h1 className='mb-6 font-bold text-5xl'>{heading}</h1>
							)}
							{!!paragraph && <div className='text-xl'>{paragraph}</div>}
						</div>
						{!!image && (
							<SmartImage image={image} className='w-full rounded-lg' />
						)}
					</div>
				</div>
			</Container>
		</Section>
	);
}
