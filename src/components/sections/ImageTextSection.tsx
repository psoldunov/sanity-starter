import Container from '@/components/layout/Container';
import type { ImageTextSectionProps } from '@/types/sections';
import SmartImage from '../utility/SmartImage';

export default function ImageTextSection(props: ImageTextSectionProps) {
	const { heading, paragraph, image } = props;

	return (
		<section className='bg-background py-20'>
			<Container>
				<div className='grid grid-cols-1 items-center gap-12 md:grid-cols-2'>
					{!!image && (
						<SmartImage image={image} className='h-96 w-full rounded-lg' />
					)}
					<div>
						{!!heading && (
							<h2 className='mb-6 font-bold text-4xl text-foreground'>
								{heading}
							</h2>
						)}
						{!!paragraph && (
							<p className='text-foreground/70 text-lg leading-relaxed'>
								{paragraph}
							</p>
						)}
					</div>
				</div>
			</Container>
		</section>
	);
}
