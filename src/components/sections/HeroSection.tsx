import { PortableText } from 'next-sanity';
import Container from '@/components/layout/Container';
import type { HeroSectionProps } from '@/types/sections';
import SmartImage from '../utility/SmartImage';

export default function HeroSection(props: HeroSectionProps) {
	const { heading, paragraph, image } = props;

	return (
		<section className='flex min-h-[600px] w-full items-center py-20'>
			<Container>
				<div className='grid grid-cols-1 items-center gap-12 md:grid-cols-2'>
					<div className='text-foreground'>
						{!!heading && (
							<h1 className='mb-6 font-bold text-5xl'>{heading}</h1>
						)}
						{!!paragraph && (
							<div className='text-xl'>
								<PortableText value={paragraph} />
							</div>
						)}
					</div>
					{!!image && (
						<SmartImage image={image} className='h-96 w-full rounded-lg' />
					)}
				</div>
			</Container>
		</section>
	);
}
